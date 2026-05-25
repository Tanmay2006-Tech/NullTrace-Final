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

router.get("/timeline-events", async (req, res): Promise<void> => {
  try {
    const incidentIdRaw = req.query.incidentId as string | undefined;
    const rows = await selectAllFromTable("timeline_events", "id");

    let mapped = rows.map((r) => ({
      id: toNumberOrNull(getFirstValue(r, ["id"])) ?? 0,
      incidentId:
        toNumberOrNull(
          getFirstValue(r, ["incident_id", "incidentId"]),
        ) ?? 0,
      timestamp: toIsoDateOrNull(
        getFirstValue(r, ["timestamp"]),
      ),
      event:
        toStringOrNull(getFirstValue(r, ["event"])) ??
        "No event",
      type:
        toStringOrNull(getFirstValue(r, ["type"])) ??
        "INFO",
      service: toStringOrNull(getFirstValue(r, ["service"])),
    }));

    if (incidentIdRaw) {
      const incidentId = parseInt(incidentIdRaw, 10);
      if (!Number.isNaN(incidentId)) {
        mapped = mapped.filter((r) => r.incidentId === incidentId);
      }
    }

    res.json(mapped);
  } catch (err) {
    logger.error({ err }, "Failed to fetch timeline events");
    res.status(500).json({ error: "Failed to load timeline events" });
  }
});

router.get("/timeline-events/:incidentId", async (req, res): Promise<void> => {
  try {
    const incidentId = parseInt(req.params.incidentId, 10);

    if (Number.isNaN(incidentId)) {
      res.status(400).json({ error: "Invalid incidentId" });
      return;
    }

    const rows = await selectAllFromTable("timeline_events", "id");
    const mapped = rows
      .map((r) => ({
        id: toNumberOrNull(getFirstValue(r, ["id"])) ?? 0,
        incidentId:
          toNumberOrNull(
            getFirstValue(r, ["incident_id", "incidentId"]),
          ) ?? 0,
        timestamp: toIsoDateOrNull(
          getFirstValue(r, ["timestamp"]),
        ),
        event:
          toStringOrNull(getFirstValue(r, ["event"])) ??
          "No event",
        type:
          toStringOrNull(getFirstValue(r, ["type"])) ??
          "INFO",
        service: toStringOrNull(getFirstValue(r, ["service"])),
      }))
      .filter((r) => r.incidentId === incidentId);

    res.json(mapped);
  } catch (err) {
    logger.error({ err }, "Failed to fetch timeline events by incident");
    res.status(500).json({ error: "Failed to load timeline events" });
  }
});

export default router;
