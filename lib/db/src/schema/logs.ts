import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const logsTable = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull().default("INFO"),
  service: text("service").notNull(),
  message: text("message").notNull(),
  traceId: text("trace_id"),
  isAnomaly: boolean("is_anomaly").notNull().default(false),
});

export const insertLogSchema = createInsertSchema(logsTable).omit({ id: true });
export type InsertLog = z.infer<typeof insertLogSchema>;
export type LogEntry = typeof logsTable.$inferSelect;
