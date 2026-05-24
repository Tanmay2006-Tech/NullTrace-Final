import { Router, type IRouter } from "express";
import { PODS } from "../lib/mock-data";

const router: IRouter = Router();

router.get("/pods", async (_req, res): Promise<void> => {
  // Add some randomness to CPU/memory for live feel
  const livePods = PODS.map((pod, i) => ({
    id: i + 1,
    ...pod,
    cpu: pod.status === "Running" ? Math.max(0, Math.min(100, pod.cpu + (Math.random() - 0.5) * 6)) : pod.cpu,
    memory: pod.status === "Running" ? Math.max(0, Math.min(100, pod.memory + (Math.random() - 0.5) * 4)) : pod.memory,
  }));

  res.json(livePods);
});

export default router;
