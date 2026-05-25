import { Router, type IRouter } from "express";
import {
  getFirstValue,
  selectAllFromTable,
  toIsoDateOrNull,
  toNumberOrNull,
  toStringOrNull,
} from "../lib/db-safe";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const STATUSES = ["HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"];

function getRandomFluctuation(base: number, variance: number): number {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance));
}

router.get("/services", async (_req, res): Promise<void> => {
  try {
    const services = await selectAllFromTable("services", "id");

    const liveServices = services.map((s) => {
      const cpu = toNumberOrNull(getFirstValue(s, ["cpu"])) ?? 0;
      const memory = toNumberOrNull(getFirstValue(s, ["memory"])) ?? 0;
      const latency = toNumberOrNull(getFirstValue(s, ["latency"])) ?? 0;
      const errorRate =
        toNumberOrNull(getFirstValue(s, ["error_rate", "errorRate"])) ?? 0;
      const requestsPerSecond =
        toNumberOrNull(
          getFirstValue(s, [
            "requests_per_second",
            "requestsPerSecond",
            "request_rate",
            "requestRate",
          ]),
        ) ?? 0;

      return {
        id: toNumberOrNull(getFirstValue(s, ["id"])) ?? 0,
        name: toStringOrNull(getFirstValue(s, ["name"])) ?? "unknown-service",
        status:
          toStringOrNull(getFirstValue(s, ["status"])) ?? STATUSES[3],
        cpu: Math.round(getRandomFluctuation(cpu, 8) * 10) / 10,
        memory: Math.round(getRandomFluctuation(memory, 5) * 10) / 10,
        latency: Math.round(getRandomFluctuation(latency, 20) * 10) / 10,
        errorRate:
          Math.round(getRandomFluctuation(errorRate, 0.5) * 100) / 100,
        requestsPerSecond:
          Math.round(
            getRandomFluctuation(requestsPerSecond, 50) * 10,
          ) / 10,
        replicas:
          toNumberOrNull(getFirstValue(s, ["replicas"])) ?? 1,
        namespace:
          toStringOrNull(getFirstValue(s, ["namespace"])) ??
          "default",
        lastUpdated:
          toIsoDateOrNull(
            getFirstValue(s, ["last_updated", "lastUpdated"]),
          ) ?? new Date().toISOString(),
      };
    });

    res.json(liveServices);
  } catch (err) {
    logger.error({ err }, "Failed to fetch services");
    res.status(500).json({
      error: "Failed to load services",
    });
  }
});

export default router;
