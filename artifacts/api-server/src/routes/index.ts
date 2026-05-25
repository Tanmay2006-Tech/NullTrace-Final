import { Router, type IRouter } from "express";
import healthRouter from "./health";
import incidentsRouter from "./incidents";
import servicesRouter from "./services";
import metricsRouter from "./metrics";
import logsRouter from "./logs";
import aiRouter from "./ai";
import podsRouter from "./pods";
import heatmapRouter from "./heatmap";
import monitoringRouter from "./monitoring";
import timelineEventsRouter from "./timeline_events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(incidentsRouter);
router.use(servicesRouter);
router.use(metricsRouter);
router.use(logsRouter);
router.use(aiRouter);
router.use(podsRouter);
router.use(heatmapRouter);
router.use(monitoringRouter);
router.use(timelineEventsRouter);

export default router;
