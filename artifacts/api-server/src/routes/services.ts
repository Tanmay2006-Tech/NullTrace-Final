import { Router, type IRouter } from "express";
import { db, servicesTable } from "@workspace/db";

const router: IRouter = Router();

const STATUSES = ["HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"];

function getRandomFluctuation(base: number, variance: number): number {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance));
}

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable);

  // Add live fluctuation to metrics
  const liveServices = services.map((s) => ({
    ...s,
    cpu: Math.round(getRandomFluctuation(s.cpu, 8) * 10) / 10,
    memory: Math.round(getRandomFluctuation(s.memory, 5) * 10) / 10,
    latency: Math.round(getRandomFluctuation(s.latency, 20) * 10) / 10,
    errorRate: Math.round(getRandomFluctuation(s.errorRate, 0.5) * 100) / 100,
    requestsPerSecond: Math.round(getRandomFluctuation(s.requestsPerSecond, 50) * 10) / 10,
    lastUpdated: new Date().toISOString(),
  }));

  res.json(liveServices);
});

export default router;
