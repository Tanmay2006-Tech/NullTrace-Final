import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  status: text("status").notNull().default("HEALTHY"),
  cpu: real("cpu").notNull().default(0),
  memory: real("memory").notNull().default(0),
  latency: real("latency").notNull().default(0),
  errorRate: real("error_rate").notNull().default(0),
  requestsPerSecond: real("requests_per_second").notNull().default(0),
  replicas: integer("replicas").notNull().default(1),
  namespace: text("namespace").notNull().default("default"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
