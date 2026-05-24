import { Router, type IRouter } from "express";
import { db, logsTable } from "@workspace/db";
import { AnalyzeLogsBody } from "@workspace/api-zod";
import { generateRCA } from "../lib/ai-analysis";
import { LOG_MESSAGES } from "../lib/mock-data";

const router: IRouter = Router();

// In-memory log buffer for streaming simulation
let logBuffer: typeof logsTable.$inferSelect[] = [];
let logIdCounter = 10000;

function generateLiveLogs(count: number) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const template = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
    return {
      id: logIdCounter++,
      timestamp: new Date(now - i * Math.random() * 30000),
      level: template.level,
      service: template.service,
      message: template.message,
      traceId: Math.random() > 0.5 ? `trace-${Math.random().toString(36).slice(2, 10)}` : null,
      isAnomaly: template.level === "ERROR" || template.level === "FATAL" ? Math.random() > 0.6 : false,
    };
  });
}

router.get("/logs", async (req, res): Promise<void> => {
  const level = req.query.level as string | undefined;
  const service = req.query.service as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10), 200);

  // Get from DB
  const dbLogs = await db.select().from(logsTable);

  // Generate some live logs
  const liveLogs = generateLiveLogs(Math.min(limit, 30));

  // Combine and filter
  let allLogs = [
    ...liveLogs,
    ...dbLogs.map((l) => ({ ...l, timestamp: l.timestamp })),
  ];

  if (level) {
    allLogs = allLogs.filter((l) => l.level === level);
  }
  if (service) {
    allLogs = allLogs.filter((l) => l.service === service);
  }

  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(
    allLogs.slice(0, limit).map((l) => ({
      ...l,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
    }))
  );
});

router.post("/logs/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeLogsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const analysis = await generateRCA({
    title: `Log anomaly analysis for ${parsed.data.service}`,
    description: "Log pattern analysis triggered by user request",
    affectedServices: [parsed.data.service],
    severity: "HIGH",
  });

  res.json(analysis);
});

export default router;
