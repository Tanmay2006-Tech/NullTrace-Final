import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, incidentsTable, timelineEventsTable } from "@workspace/db";
import {
  ListIncidentsQueryParams,
  CreateIncidentBody,
  GetIncidentParams,
  UpdateIncidentParams,
  UpdateIncidentBody,
  AnalyzeIncidentParams,
  GetIncidentTimelineParams,
} from "@workspace/api-zod";
import { generateRCA } from "../lib/ai-analysis";

const router: IRouter = Router();

router.get("/incidents", async (req, res): Promise<void> => {
  const query = ListIncidentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(incidentsTable).$dynamic();

  const rows = await db.select().from(incidentsTable);
  let filtered = rows;

  if (query.data.status) {
    filtered = filtered.filter((r) => r.status === query.data.status);
  }
  if (query.data.severity) {
    filtered = filtered.filter((r) => r.severity === query.data.severity);
  }

  const limit = query.data.limit ?? 50;
  const results = filtered.slice(0, limit);

  res.json(
    results.map((r) => ({
      ...r,
      affectedServices: r.affectedServices as string[],
      suggestedCommands: r.suggestedCommands as string[],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
    }))
  );
});

router.post("/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [incident] = await db
    .insert(incidentsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      affectedServices: parsed.data.affectedServices,
      suggestedCommands: [],
    })
    .returning();

  // Auto-add initial timeline event
  await db.insert(timelineEventsTable).values({
    incidentId: incident.id,
    timestamp: new Date(),
    event: "Incident detected and created",
    type: "DETECTION",
    service: (parsed.data.affectedServices as string[])[0] ?? null,
  });

  res.status(201).json({
    ...incident,
    affectedServices: incident.affectedServices as string[],
    suggestedCommands: incident.suggestedCommands as string[],
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
  });
});

router.get("/incidents/summary", async (_req, res): Promise<void> => {
  const incidents = await db.select().from(incidentsTable);
  const critical = incidents.filter(
    (i) => (i.severity === "CRITICAL" || i.severity === "HIGH") && i.status !== "RESOLVED" && i.status !== "CLOSED"
  );

  const incident = critical.length > 0
    ? critical.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    : incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  if (!incident) {
    res.status(404).json({ error: "No incidents found" });
    return;
  }

  const analysis = await generateRCA({
    title: incident.title,
    description: incident.description,
    affectedServices: incident.affectedServices as string[],
    severity: incident.severity,
  });

  const timeline = await db
    .select()
    .from(timelineEventsTable)
    .then((rows) => rows.filter((r) => r.incidentId === incident.id));

  res.json({
    incident: {
      ...incident,
      affectedServices: incident.affectedServices as string[],
      suggestedCommands: incident.suggestedCommands as string[],
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    },
    analysis,
    timeline: timeline.map((t) => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
    })),
  });
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  const params = GetIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json({
    ...incident,
    affectedServices: incident.affectedServices as string[],
    suggestedCommands: incident.suggestedCommands as string[],
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
  });
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const params = UpdateIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title) updateData.title = parsed.data.title;
  if (parsed.data.description) updateData.description = parsed.data.description;
  if (parsed.data.severity) updateData.severity = parsed.data.severity;
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }
  }
  if (parsed.data.rootCause) updateData.rootCause = parsed.data.rootCause;
  if (parsed.data.aiAnalysis) updateData.aiAnalysis = parsed.data.aiAnalysis;
  if (parsed.data.confidence) updateData.confidence = parsed.data.confidence;

  const [incident] = await db
    .update(incidentsTable)
    .set(updateData)
    .where(eq(incidentsTable.id, id))
    .returning();

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json({
    ...incident,
    affectedServices: incident.affectedServices as string[],
    suggestedCommands: incident.suggestedCommands as string[],
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
  });
});

router.post("/incidents/:id/rca", async (req, res): Promise<void> => {
  const params = AnalyzeIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  const analysis = await generateRCA({
    title: incident.title,
    description: incident.description,
    affectedServices: incident.affectedServices as string[],
    severity: incident.severity,
  });

  // Update the incident with the RCA result
  await db
    .update(incidentsTable)
    .set({
      rootCause: analysis.rootCause,
      aiAnalysis: analysis.humanExplanation,
      confidence: analysis.confidence,
      suggestedCommands: analysis.suggestedCommands,
      updatedAt: new Date(),
    })
    .where(eq(incidentsTable.id, id));

  res.json(analysis);
});

router.get("/incidents/:id/timeline", async (req, res): Promise<void> => {
  const params = GetIncidentTimelineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const events = await db.select().from(timelineEventsTable).then((rows) =>
    rows
      .filter((r) => r.incidentId === id)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  );

  res.json(
    events.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    }))
  );
});

export default router;
