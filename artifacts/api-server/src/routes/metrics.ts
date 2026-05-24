import { Router, type IRouter } from "express";
import { generateMetricsTimeSeries } from "../lib/mock-data";

const router: IRouter = Router();

function getPoints(range: string | undefined): number {
  switch (range) {
    case "1h": return 60;
    case "6h": return 72;
    case "24h": return 96;
    default: return 60;
  }
}

router.get("/metrics", async (req, res): Promise<void> => {
  const range = req.query.range as string | undefined;
  const points = getPoints(range);
  const spikeAt = Math.floor(points * 0.6);

  // Simulate a recent incident spike in the metrics
  res.json({
    cpu: generateMetricsTimeSeries(points, 45, 15, spikeAt),
    memory: generateMetricsTimeSeries(points, 58, 10, spikeAt),
    latency: generateMetricsTimeSeries(points, 180, 60, spikeAt),
    errorRate: generateMetricsTimeSeries(points, 0.8, 0.4, spikeAt),
    requestRate: generateMetricsTimeSeries(points, 340, 80, spikeAt),
  });
});

router.get("/metrics/health-score", async (_req, res): Promise<void> => {
  const base = 84;
  const score = Math.max(60, Math.min(99, base + Math.floor((Math.random() - 0.5) * 6)));

  const components = [
    { name: "API Gateway", score: Math.max(70, score + Math.floor(Math.random() * 10)), status: "HEALTHY" },
    { name: "Services", score: Math.max(60, score - Math.floor(Math.random() * 20)), status: "DEGRADED" },
    { name: "Database", score: Math.max(55, score - Math.floor(Math.random() * 25)), status: "DEGRADED" },
    { name: "Network", score: Math.max(75, score + Math.floor(Math.random() * 8)), status: "HEALTHY" },
    { name: "Storage", score: Math.max(65, score - Math.floor(Math.random() * 15)), status: "HEALTHY" },
  ];

  const trend = score >= 85 ? "improving" : score >= 70 ? "stable" : "declining";

  res.json({ score, trend, components });
});

export default router;
