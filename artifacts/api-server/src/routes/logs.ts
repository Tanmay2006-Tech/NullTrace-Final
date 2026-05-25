import { Router, type IRouter } from "express";
import { AnalyzeLogsBody } from "@workspace/api-zod";
import { generateRCA } from "../lib/ai-analysis";
import { LOG_MESSAGES } from "../lib/mock-data";
import {
  getFirstValue,
  selectAllFromTable,
  toBooleanOrDefault,
  toIsoDateOrNull,
  toNumberOrNull,
  toStringOrNull,
} from "../lib/db-safe";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// In-memory log buffer for streaming simulation
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
  try {
    const level = req.query.level as string | undefined;
    const service = req.query.service as string | undefined;
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10),
      200,
    );

    const dbLogs = await selectAllFromTable("logs", "id");

    const normalizedDbLogs = dbLogs.map((l) => ({
      id: toNumberOrNull(getFirstValue(l, ["id"])) ?? 0,
      timestamp:
        toIsoDateOrNull(getFirstValue(l, ["timestamp"])) ??
        new Date().toISOString(),
      level:
        toStringOrNull(getFirstValue(l, ["level"])) ?? "INFO",
      service:
        toStringOrNull(getFirstValue(l, ["service"])) ??
        "unknown-service",
      message:
        toStringOrNull(getFirstValue(l, ["message"])) ??
        "No message",
      traceId: toStringOrNull(
        getFirstValue(l, ["trace_id", "traceId"]),
      ),
      isAnomaly: toBooleanOrDefault(
        getFirstValue(l, ["is_anomaly", "isAnomaly"]),
        false,
      ),
    }));

    const liveLogs = generateLiveLogs(Math.min(limit, 30));

    let allLogs = [...liveLogs, ...normalizedDbLogs];

    if (level) {
      allLogs = allLogs.filter((l) => l.level === level);
    }
    if (service) {
      allLogs = allLogs.filter((l) => l.service === service);
    }

    allLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    );

    res.json(allLogs.slice(0, limit));
  } catch (err) {
    logger.error({ err }, "Failed to fetch logs");
    res.status(500).json({
      error: "Failed to load logs",
    });
  }
});

router.post("/logs/analyze", async (req, res): Promise<void> => {
  try {
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
  } catch (err) {
    logger.error({ err }, "Failed to analyze logs");
    res.status(500).json({
      error: "Failed to analyze logs",
    });
  }
});

export default router;
