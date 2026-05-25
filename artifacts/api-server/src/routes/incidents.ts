import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import {
  ListIncidentsQueryParams,
  CreateIncidentBody,
  GetIncidentParams,
} from "@workspace/api-zod";
import { generateRCA } from "../lib/ai-analysis";
import {
  getFirstValue,
  getTableColumns,
  hasTable,
  selectAllFromTable,
  toIsoDateOrNull,
  toNumberOrNull,
  toStringArray,
  toStringOrNull,
} from "../lib/db-safe";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ENABLE_DEMO_SEED = process.env.ENABLE_DEMO_SEED === "true";

type NormalizedIncident = {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  source: string | null;
  affectedServices: string[];
  rootCause: string | null;
  aiAnalysis: string | null;
  confidence: number | null;
  suggestedCommands: string[];
  createdAt: string | null;
  updatedAt: string | null;
  resolvedAt: string | null;
};

function normalizeIncident(
  row: Record<string, unknown>,
): NormalizedIncident {
  return {
    id: toNumberOrNull(getFirstValue(row, ["id"])) ?? 0,
    title: toStringOrNull(getFirstValue(row, ["title"])) ?? "Untitled Incident",
    description:
      toStringOrNull(getFirstValue(row, ["description"])) ??
      "No description",
    severity:
      toStringOrNull(getFirstValue(row, ["severity"])) ?? "MEDIUM",
    status: toStringOrNull(getFirstValue(row, ["status"])) ?? "OPEN",
    source: toStringOrNull(getFirstValue(row, ["source"])),
    affectedServices: toStringArray(
      getFirstValue(row, ["affected_services", "affectedServices"]),
    ),
    rootCause: toStringOrNull(
      getFirstValue(row, ["root_cause", "rootCause"]),
    ),
    aiAnalysis: toStringOrNull(
      getFirstValue(row, ["ai_analysis", "aiAnalysis"]),
    ),
    confidence: toNumberOrNull(getFirstValue(row, ["confidence"])),
    suggestedCommands: toStringArray(
      getFirstValue(row, ["suggested_commands", "suggestedCommands"]),
    ),
    createdAt: toIsoDateOrNull(
      getFirstValue(row, ["created_at", "createdAt"]),
    ),
    updatedAt: toIsoDateOrNull(
      getFirstValue(row, ["updated_at", "updatedAt"]),
    ),
    resolvedAt: toIsoDateOrNull(
      getFirstValue(row, ["resolved_at", "resolvedAt"]),
    ),
  };
}

function normalizeTimelineEvent(row: Record<string, unknown>) {
  return {
    id: toNumberOrNull(getFirstValue(row, ["id"])) ?? 0,
    incidentId:
      toNumberOrNull(
        getFirstValue(row, ["incident_id", "incidentId"]),
      ) ?? 0,
    timestamp: toIsoDateOrNull(getFirstValue(row, ["timestamp"])),
    event:
      toStringOrNull(getFirstValue(row, ["event"])) ??
      "No event description",
    type: toStringOrNull(getFirstValue(row, ["type"])) ?? "INFO",
    service: toStringOrNull(getFirstValue(row, ["service"])),
  };
}

async function insertIncident(
  values: {
    title: string;
    description: string;
    severity: string;
    status?: string;
    source?: string | null;
    affectedServices?: string[];
    suggestedCommands?: string[];
  },
): Promise<NormalizedIncident | null> {
  const tableName = "incidents";
  const tableExists = await hasTable(tableName);
  if (!tableExists) {
    return null;
  }

  const columns = await getTableColumns(tableName);
  const entries: [string, unknown][] = [];

  if (columns.has("title")) entries.push(["title", values.title]);
  if (columns.has("description")) {
    entries.push(["description", values.description]);
  }
  if (columns.has("severity")) entries.push(["severity", values.severity]);
  if (columns.has("status")) entries.push(["status", values.status ?? "OPEN"]);
  if (columns.has("source")) entries.push(["source", values.source ?? null]);
  if (columns.has("affected_services")) {
    entries.push(["affected_services", values.affectedServices ?? []]);
  }
  if (columns.has("suggested_commands")) {
    entries.push(["suggested_commands", values.suggestedCommands ?? []]);
  }
  if (columns.has("created_at")) entries.push(["created_at", new Date()]);
  if (columns.has("updated_at")) entries.push(["updated_at", new Date()]);

  if (entries.length === 0) {
    return null;
  }

  const columnSql = entries.map(([key]) => `"${key}"`).join(", ");
  const valueSql = entries.map((_, i) => `$${i + 1}`).join(", ");
  const queryValues = entries.map(([, value]) => value);

  const result = await pool.query(
    `insert into "${tableName}" (${columnSql})
     values (${valueSql})
     returning *`,
    queryValues,
  );

  const [row] = result.rows as Record<string, unknown>[];
  return row ? normalizeIncident(row) : null;
}

async function seedDemoIncidents(): Promise<void> {
  if (!ENABLE_DEMO_SEED) {
    return;
  }

  try {
    const existing = await selectAllFromTable("incidents", "id");
    if (existing.length > 0) return;

    const seedRows = [
      {
        title: "Payment API Latency Spike",
        description: "Latency exceeded threshold across payment services",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        source: "Prometheus",
        affectedServices: ["payments-api", "postgres-db"],
        suggestedCommands: [
          "kubectl rollout restart deployment/payments-api",
        ],
      },
      {
        title: "Redis Cache Miss Storm",
        description: "High cache miss ratio detected",
        severity: "HIGH",
        status: "MONITORING",
        source: "Grafana",
        affectedServices: ["redis-cache", "session-service"],
        suggestedCommands: ["redis-cli info memory"],
      },
      {
        title: "Webhook Queue Saturation",
        description: "Webhook workers are delayed",
        severity: "MEDIUM",
        status: "IDENTIFIED",
        source: "OpenTelemetry",
        affectedServices: ["webhook-worker"],
        suggestedCommands: ["pm2 restart webhook-worker"],
      },
    ];

    for (const row of seedRows) {
      await insertIncident(row);
    }
  } catch (err) {
    logger.error({ err }, "Demo incident seed failed");
  }
}

async function getSummaryResponse() {
  await seedDemoIncidents();

  const incidentRows = await selectAllFromTable("incidents", "id");
  const incidents = incidentRows.map(normalizeIncident);

  const critical = incidents.filter(
    (i) =>
      (i.severity === "CRITICAL" || i.severity === "HIGH") &&
      i.status !== "RESOLVED" &&
      i.status !== "CLOSED",
  );

  const incident = critical.length > 0 ? critical[0] : incidents[0];
  if (!incident) {
    return null;
  }

  let analysis;
  try {
    analysis = await generateRCA({
      title: incident.title,
      description: incident.description,
      affectedServices: incident.affectedServices,
      severity: incident.severity,
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate RCA for summary");
    analysis = {
      rootCause: "AI analysis unavailable",
      whyItHappened: "Unable to generate detailed analysis at this time.",
      humanExplanation: "The AI service is temporarily unavailable.",
      suggestedSolutions: ["Inspect service logs", "Check recent deployments"],
      suggestedCommands: ["kubectl get pods -A", "kubectl logs deployment/api-server"],
      confidence: 50,
      severity: incident.severity,
      affectedServices: incident.affectedServices,
      insights: ["Fallback analysis used"],
    };
  }

  let timeline: ReturnType<typeof normalizeTimelineEvent>[] = [];
  try {
    const timelineRows = await selectAllFromTable("timeline_events", "id");
    timeline = timelineRows
      .map(normalizeTimelineEvent)
      .filter((row) => row.incidentId === incident.id);
  } catch (err) {
    logger.error({ err }, "Failed to load timeline events for summary");
  }

  return { incident, analysis, timeline };
}

router.get("/incidents", async (req, res): Promise<void> => {
  try {
    await seedDemoIncidents();

    const query = ListIncidentsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({
        error: query.error.message || "Invalid query",
      });
      return;
    }

    const rows = await selectAllFromTable("incidents", "id");
    let filtered = rows.map(normalizeIncident);

    if (query.data.status) {
      filtered = filtered.filter((r) => r.status === query.data.status);
    }

    if (query.data.severity) {
      filtered = filtered.filter((r) => r.severity === query.data.severity);
    }

    const limit = query.data.limit ?? 50;
    res.json(filtered.slice(0, limit));
  } catch (err) {
    logger.error({ err }, "Failed to fetch incidents");
    res.status(500).json({
      error: "Failed to load incidents",
    });
  }
});

router.post("/incidents", async (req, res): Promise<void> => {
  try {
    const parsed = CreateIncidentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.message || "Invalid body",
      });
      return;
    }

    const incident = await insertIncident({
      title: parsed.data.title || "Unknown Incident",
      description: parsed.data.description || "No description",
      severity: parsed.data.severity || "MEDIUM",
      affectedServices: parsed.data.affectedServices || [],
      suggestedCommands: [],
    });

    if (!incident) {
      res.status(500).json({
        error: "Failed to create incident",
      });
      return;
    }

    try {
      const timelineExists = await hasTable("timeline_events");
      if (timelineExists) {
        const timelineColumns = await getTableColumns("timeline_events");
        const timelineEntries: [string, unknown][] = [];
        if (timelineColumns.has("incident_id")) {
          timelineEntries.push(["incident_id", incident.id]);
        }
        if (timelineColumns.has("timestamp")) {
          timelineEntries.push(["timestamp", new Date()]);
        }
        if (timelineColumns.has("event")) {
          timelineEntries.push(["event", "Incident detected and created"]);
        }
        if (timelineColumns.has("type")) {
          timelineEntries.push(["type", "DETECTION"]);
        }
        if (timelineColumns.has("service")) {
          timelineEntries.push([
            "service",
            parsed.data.affectedServices?.[0] ?? null,
          ]);
        }

        if (timelineEntries.length > 0) {
          const colSql = timelineEntries.map(([col]) => `"${col}"`).join(", ");
          const valSql = timelineEntries.map((_, i) => `$${i + 1}`).join(", ");
          await pool.query(
            `insert into "timeline_events" (${colSql}) values (${valSql})`,
            timelineEntries.map(([, value]) => value),
          );
        }
      }
    } catch (err) {
      logger.error({ err, incidentId: incident.id }, "Failed to create timeline event");
    }

    res.status(201).json(incident);
  } catch (err) {
    logger.error({ err }, "Failed to create incident");
    res.status(500).json({
      error: "Failed to create incident",
    });
  }
});

router.get("/incidents/summary", async (_req, res): Promise<void> => {
  try {
    const summary = await getSummaryResponse();
    if (!summary) {
      res.status(404).json({
        error: "No incidents found",
      });
      return;
    }
    res.json(summary);
  } catch (err) {
    logger.error({ err }, "Failed to fetch incident summary");
    res.status(500).json({
      error: "Failed to load incident summary",
    });
  }
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  try {
    const summary = await getSummaryResponse();
    if (!summary) {
      res.status(404).json({
        error: "No incidents found",
      });
      return;
    }
    res.json(summary);
  } catch (err) {
    logger.error({ err }, "Failed to fetch dashboard summary");
    res.status(500).json({
      error: "Failed to load dashboard summary",
    });
  }
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  try {
    const params = GetIncidentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({
        error: params.error.message,
      });
      return;
    }

    const raw = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(raw || "0", 10);

    const rows = await selectAllFromTable("incidents", "id");
    const incident = rows
      .map(normalizeIncident)
      .find((r) => r.id === id);

    if (!incident) {
      res.status(404).json({
        error: "Incident not found",
      });
      return;
    }

    res.json(incident);
  } catch (err) {
    logger.error({ err }, "Failed to fetch incident by id");
    res.status(500).json({
      error: "Failed to load incident",
    });
  }
});

export default router;
