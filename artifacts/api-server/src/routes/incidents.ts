import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, incidentsTable, timelineEventsTable } from "@workspace/db";
import {
  ListIncidentsQueryParams,
  CreateIncidentBody,
  GetIncidentParams,
} from "@workspace/api-zod";
import { generateRCA } from "../lib/ai-analysis";

const router: IRouter = Router();

async function seedDemoIncidents() {
  const existing = await db.select().from(incidentsTable);

  if (existing.length > 0) return;

  await db.insert(incidentsTable).values([
    {
      title: "Payment API Latency Spike",
      description:
        "Latency exceeded threshold across payment services",
      severity: "CRITICAL",
      status: "INVESTIGATING",
      source: "Prometheus",
      confidence: 94,
      affectedServices: [
        "payments-api",
        "postgres-db",
      ],
      suggestedCommands: [
        "kubectl rollout restart deployment/payments-api",
      ],
    },

    {
      title: "Redis Cache Miss Storm",
      description:
        "High cache miss ratio detected",
      severity: "HIGH",
      status: "MONITORING",
      source: "Grafana",
      confidence: 87,
      affectedServices: [
        "redis-cache",
        "session-service",
      ],
      suggestedCommands: [
        "redis-cli info memory",
      ],
    },

    {
      title: "Webhook Queue Saturation",
      description:
        "Webhook workers are delayed",
      severity: "MEDIUM",
      status: "IDENTIFIED",
      source: "OpenTelemetry",
      confidence: 76,
      affectedServices: [
        "webhook-worker",
      ],
      suggestedCommands: [
        "pm2 restart webhook-worker",
      ],
    },
  ]);
}

router.get("/incidents", async (req, res): Promise<void> => {
  await seedDemoIncidents();

  const query = ListIncidentsQueryParams.safeParse(req.query);

  if (!query.success) {
    res.status(400).json({
      error: query?.error?.message || "Invalid query",
    });

    return;
  }

  const rows = await db.select().from(incidentsTable);

  let filtered = rows || [];

  if (query?.data?.status) {
    filtered = filtered.filter(
      (r) => r?.status === query.data.status
    );
  }

  if (query?.data?.severity) {
    filtered = filtered.filter(
      (r) => r?.severity === query.data.severity
    );
  }

  const limit = query?.data?.limit ?? 50;

  const results = filtered.slice(0, limit);

  res.json(
    results.map((r) => ({
      ...r,

      affectedServices:
        (r?.affectedServices as string[]) || [],

      suggestedCommands:
        (r?.suggestedCommands as string[]) || [],

      createdAt:
        r?.createdAt?.toISOString?.() || null,

      updatedAt:
        r?.updatedAt?.toISOString?.() || null,

      resolvedAt:
        r?.resolvedAt?.toISOString?.() || null,
    }))
  );
});

router.post("/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: parsed?.error?.message || "Invalid body",
    });

    return;
  }

  const [incident] = await db
    .insert(incidentsTable)
    .values({
      title:
        parsed?.data?.title ||
        "Unknown Incident",

      description:
        parsed?.data?.description ||
        "No description",

      severity:
        parsed?.data?.severity || "MEDIUM",

      affectedServices:
        parsed?.data?.affectedServices || [],

      suggestedCommands: [],
    })
    .returning();

  await db.insert(timelineEventsTable).values({
    incidentId: incident?.id,

    timestamp: new Date(),

    event: "Incident detected and created",

    type: "DETECTION",

    service:
      (parsed?.data?.affectedServices as string[])?.[0] ||
      null,
  });

  res.status(201).json({
    ...incident,

    affectedServices:
      (incident?.affectedServices as string[]) ||
      [],

    suggestedCommands:
      (incident?.suggestedCommands as string[]) ||
      [],

    createdAt:
      incident?.createdAt?.toISOString?.() || null,

    updatedAt:
      incident?.updatedAt?.toISOString?.() || null,

    resolvedAt:
      incident?.resolvedAt?.toISOString?.() || null,
  });
});

router.get(
  "/incidents/summary",
  async (_req, res): Promise<void> => {
    await seedDemoIncidents();

    const incidents =
      (await db.select().from(incidentsTable)) ||
      [];

    const critical = incidents.filter(
      (i) =>
        (i?.severity === "CRITICAL" ||
          i?.severity === "HIGH") &&
        i?.status !== "RESOLVED" &&
        i?.status !== "CLOSED"
    );

    const incident =
      critical.length > 0
        ? critical[0]
        : incidents[0];

    if (!incident) {
      res.status(404).json({
        error: "No incidents found",
      });

      return;
    }

    const analysis = await generateRCA({
      title: incident?.title,
      description: incident?.description,

      affectedServices:
        (incident?.affectedServices as string[]) ||
        [],

      severity:
        incident?.severity || "MEDIUM",
    });

    const timeline = await db
      .select()
      .from(timelineEventsTable)
      .then((rows) =>
        rows.filter(
          (r) => r?.incidentId === incident?.id
        )
      );

    res.json({
      incident: {
        ...incident,

        affectedServices:
          (incident?.affectedServices as string[]) ||
          [],

        suggestedCommands:
          (incident?.suggestedCommands as string[]) ||
          [],

        createdAt:
          incident?.createdAt?.toISOString?.() ||
          null,

        updatedAt:
          incident?.updatedAt?.toISOString?.() ||
          null,

        resolvedAt:
          incident?.resolvedAt?.toISOString?.() ||
          null,
      },

      analysis,

      timeline: timeline.map((t) => ({
        ...t,

        timestamp:
          t?.timestamp?.toISOString?.() || null,
      })),
    });
  }
);

router.get("/incidents/:id", async (req, res) => {
  const params = GetIncidentParams.safeParse(
    req.params
  );

  if (!params.success) {
    res.status(400).json({
      error: params?.error?.message,
    });

    return;
  }

  const raw = Array.isArray(req?.params?.id)
    ? req.params.id[0]
    : req?.params?.id;

  const id = parseInt(raw || "0", 10);

  const [incident] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, id));

  if (!incident) {
    res.status(404).json({
      error: "Incident not found",
    });

    return;
  }

  res.json({
    ...incident,

    affectedServices:
      (incident?.affectedServices as string[]) ||
      [],

    suggestedCommands:
      (incident?.suggestedCommands as string[]) ||
      [],

    createdAt:
      incident?.createdAt?.toISOString?.() || null,

    updatedAt:
      incident?.updatedAt?.toISOString?.() || null,

    resolvedAt:
      incident?.resolvedAt?.toISOString?.() || null,
  });
});

export default router;