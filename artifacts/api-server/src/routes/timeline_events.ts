import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, timelineEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/timeline-events", async (req, res): Promise<void> => {
  const incidentIdRaw = req.query.incidentId as string | undefined;

  let rows = await db.select().from(timelineEventsTable);

  if (incidentIdRaw) {
    const incidentId = parseInt(incidentIdRaw, 10);
    if (!isNaN(incidentId)) {
      rows = rows.filter((r) => r.incidentId === incidentId);
    }
  }

  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.timestamp?.toISOString?.() || null,
    }))
  );
});

router.get("/timeline-events/:incidentId", async (req, res): Promise<void> => {
  const incidentId = parseInt(req.params.incidentId, 10);

  if (isNaN(incidentId)) {
    res.status(400).json({ error: "Invalid incidentId" });
    return;
  }

  const rows = await db
    .select()
    .from(timelineEventsTable)
    .where(eq(timelineEventsTable.incidentId, incidentId));

  res.json(
    rows.map((r) => ({
      ...r,
      timestamp: r.timestamp?.toISOString?.() || null,
    }))
  );
});

export default router;
