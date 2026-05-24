import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SERVICES = [
  "api-gateway",
  "auth-service",
  "checkout-service",
  "payment-service",
  "user-service",
  "postgres-primary",
];

const SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NONE"];

function getSeverityForCount(count: number): string {
  if (count === 0) return "NONE";
  if (count === 1) return "LOW";
  if (count <= 3) return "MEDIUM";
  if (count <= 6) return "HIGH";
  return "CRITICAL";
}

router.get("/heatmap", async (_req, res): Promise<void> => {
  const entries: Array<{ service: string; hour: number; incidentCount: number; severity: string }> = [];

  for (const service of SERVICES) {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher incident rates during business hours and for troubled services
      let baseRate = hour >= 8 && hour <= 20 ? 1.5 : 0.5;
      if (service === "checkout-service") baseRate *= 2.5;
      if (service === "auth-service") baseRate *= 1.8;
      if (service === "postgres-primary") baseRate *= 1.5;

      // Recent hours have more incidents (simulating current outage)
      const currentHour = new Date().getHours();
      if (Math.abs(hour - currentHour) <= 2) baseRate *= 2;

      const count = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * baseRate * 5);

      entries.push({
        service,
        hour,
        incidentCount: count,
        severity: getSeverityForCount(count),
      });
    }
  }

  res.json(entries);
});

export default router;
