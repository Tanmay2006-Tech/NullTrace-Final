import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timelineEventsTable = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  event: text("event").notNull(),
  type: text("type").notNull().default("INFO"),
  service: text("service"),
});

export const insertTimelineEventSchema = createInsertSchema(timelineEventsTable).omit({ id: true });
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEventsTable.$inferSelect;
