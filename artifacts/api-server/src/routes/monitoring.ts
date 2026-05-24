import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, incidentsTable, timelineEventsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { generateRCA } from "../lib/ai-analysis";

const router: IRouter = Router();

const ALERT_TEMPLATES = [
  {
    title: "High Error Rate on api-gateway",
    description: "Error rate on api-gateway exceeded 5% threshold. Currently at 12.3% — p99 latency at 4.2s.",
    severity: "HIGH",
    affectedServices: ["api-gateway", "checkout-service"],
    source: "Datadog",
    metric: "error_rate",
    value: "12.3%",
    threshold: "5%",
  },
  {
    title: "PostgreSQL Connection Pool Exhaustion",
    description: "DB connection pool utilization reached 95%. Services are queuing and timing out waiting for connections.",
    severity: "CRITICAL",
    affectedServices: ["postgres-primary", "checkout-service", "auth-service"],
    source: "Grafana",
    metric: "db_pool_utilization",
    value: "95%",
    threshold: "80%",
  },
  {
    title: "Memory Pressure on checkout-service",
    description: "checkout-service pods consuming 94% of memory limit. OOM kill risk in next 10 minutes.",
    severity: "HIGH",
    affectedServices: ["checkout-service"],
    source: "New Relic",
    metric: "memory_utilization",
    value: "94%",
    threshold: "80%",
  },
  {
    title: "Authentication Failure Spike",
    description: "Auth service reporting 847 failed login attempts in last 10 minutes — possible credential stuffing attack.",
    severity: "CRITICAL",
    affectedServices: ["auth-service", "user-service"],
    source: "Datadog",
    metric: "auth_failure_rate",
    value: "847/10m",
    threshold: "50/10m",
  },
  {
    title: "Pod CrashLoopBackOff — payment-service",
    description: "payment-service pod restarted 5 times in the last 20 minutes. Last exit code: 137 (OOM).",
    severity: "HIGH",
    affectedServices: ["payment-service"],
    source: "Kubernetes",
    metric: "pod_restarts",
    value: "5",
    threshold: "3",
  },
  {
    title: "Disk I/O Saturation",
    description: "Disk I/O on postgres-primary at 94% utilization. Write latency elevated to 340ms (baseline: 12ms).",
    severity: "MEDIUM",
    affectedServices: ["postgres-primary"],
    source: "Grafana",
    metric: "disk_io_utilization",
    value: "94%",
    threshold: "75%",
  },
  {
    title: "CPU Throttling on worker nodes",
    description: "3 of 8 worker nodes reporting CPU throttling. Scheduler unable to place new pods efficiently.",
    severity: "MEDIUM",
    affectedServices: ["worker-node-1", "worker-node-2", "worker-node-3"],
    source: "New Relic",
    metric: "cpu_throttle_ratio",
    value: "67%",
    threshold: "40%",
  },
];

let lastAlertIndex = 0;

router.get("/monitoring/alerts", (_req, res): void => {
  const alerts = ALERT_TEMPLATES.map((t, i) => ({
    id: `alert-${i + 1}`,
    ...t,
    status: "FIRING",
    firedAt: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
  }));
  res.json({ alerts, total: alerts.length });
});

router.post("/monitoring/simulate", async (_req, res): Promise<void> => {
  const template = ALERT_TEMPLATES[lastAlertIndex % ALERT_TEMPLATES.length];
  lastAlertIndex++;

  try {
    const [incident] = await db
      .insert(incidentsTable)
      .values({
        title: template.title,
        description: `[${template.source}] ${template.description} (metric: ${template.metric}, value: ${template.value}, threshold: ${template.threshold})`,
        severity: template.severity,
        affectedServices: template.affectedServices,
        suggestedCommands: [],
      })
      .returning();

    await db.insert(timelineEventsTable).values({
      incidentId: incident.id,
      timestamp: new Date(),
      event: `Alert fired from ${template.source}: ${template.metric} = ${template.value} (threshold: ${template.threshold})`,
      type: "DETECTION",
      service: template.affectedServices[0] ?? null,
    });

    logger.info({ title: template.title, source: template.source }, "Simulated monitoring alert created incident");

    res.status(201).json({
      ...incident,
      affectedServices: incident.affectedServices as string[],
      suggestedCommands: incident.suggestedCommands as string[],
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
      resolvedAt: null,
      source: template.source,
      metric: template.metric,
      value: template.value,
    });

    generateRCA({
      title: template.title,
      description: template.description,
      affectedServices: template.affectedServices,
      severity: template.severity,
    })
      .then(async (analysis) => {
        await db
          .update(incidentsTable)
          .set({
            rootCause: analysis.rootCause,
            aiAnalysis: analysis.humanExplanation,
            confidence: analysis.confidence,
            suggestedCommands: analysis.suggestedCommands,
            updatedAt: new Date(),
          })
          .where(eq(incidentsTable.id, incident.id));
        logger.info({ incidentId: incident.id }, "Background RCA saved for simulated incident");
      })
      .catch((err) => {
        logger.error({ err, incidentId: incident.id }, "Background RCA generation failed");
      });
  } catch (err) {
    logger.error({ err }, "Failed to simulate monitoring alert");
    res.status(500).json({ error: "Failed to create incident from alert" });
  }
});

export default router;
