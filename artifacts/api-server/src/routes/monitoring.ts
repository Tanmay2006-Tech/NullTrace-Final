import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  incidentsTable,
  timelineEventsTable,
} from "@workspace/db";

import { logger } from "../lib/logger";
import { generateRCA } from "../lib/ai-analysis";

const router: IRouter = Router();

const ALERT_TEMPLATES = [
  {
    title: "High Error Rate on api-gateway",

    description:
      "Error rate on api-gateway exceeded 5% threshold. Currently at 12.3% — p99 latency at 4.2s.",

    severity: "HIGH",

    affectedServices: [
      "api-gateway",
      "checkout-service",
    ],

    source: "Datadog",

    metric: "error_rate",

    value: "12.3%",

    threshold: "5%",
  },

  {
    title:
      "PostgreSQL Connection Pool Exhaustion",

    description:
      "DB connection pool utilization reached 95%. Services are queuing and timing out waiting for connections.",

    severity: "CRITICAL",

    affectedServices: [
      "postgres-primary",
      "checkout-service",
      "auth-service",
    ],

    source: "Grafana",

    metric: "db_pool_utilization",

    value: "95%",

    threshold: "80%",
  },

  {
    title:
      "Memory Pressure on checkout-service",

    description:
      "checkout-service pods consuming 94% of memory limit.",

    severity: "HIGH",

    affectedServices: ["checkout-service"],

    source: "New Relic",

    metric: "memory_utilization",

    value: "94%",

    threshold: "80%",
  },
];

let lastAlertIndex = 0;

router.get(
  "/monitoring/alerts",
  (_req, res): void => {
    const alerts = ALERT_TEMPLATES.map(
      (t, i) => ({
        id: `alert-${i + 1}`,

        ...t,

        severity:
          t?.severity || "MEDIUM",

        affectedServices:
          t?.affectedServices || [],

        status: "FIRING",

        firedAt: new Date(
          Date.now() -
            Math.random() *
              30 *
              60 *
              1000
        ).toISOString(),
      })
    );

    res.json({
      alerts: Array.isArray(alerts)
        ? alerts
        : [],

      total: alerts?.length || 0,
    });
  }
);

router.post(
  "/monitoring/simulate",
  async (_req, res): Promise<void> => {
    const template =
      ALERT_TEMPLATES[
        lastAlertIndex %
          ALERT_TEMPLATES.length
      ];

    lastAlertIndex++;

    if (!template) {
      res.status(500).json({
        error:
          "No monitoring template found",
      });

      return;
    }

    try {
      const [incident] = await db
        .insert(incidentsTable)
        .values({
          title:
            template?.title ||
            "Unknown Incident",

          description: `[${
            template?.source || "Unknown"
          }] ${
            template?.description ||
            "No description"
          } (metric: ${
            template?.metric || "unknown"
          }, value: ${
            template?.value || "unknown"
          }, threshold: ${
            template?.threshold ||
            "unknown"
          })`,

          severity:
            template?.severity ||
            "MEDIUM",

          affectedServices:
            template?.affectedServices ||
            [],

          suggestedCommands: [],
        })
        .returning();

      await db
        .insert(timelineEventsTable)
        .values({
          incidentId:
            incident?.id || 0,

          timestamp: new Date(),

          event: `Alert fired from ${
            template?.source || "Unknown"
          }: ${
            template?.metric || "unknown"
          } = ${
            template?.value || "unknown"
          } (threshold: ${
            template?.threshold ||
            "unknown"
          })`,

          type: "DETECTION",

          service:
            template
              ?.affectedServices?.[0] ||
            null,
        });

      logger.info(
        {
          title:
            template?.title ||
            "Unknown",

          source:
            template?.source ||
            "Unknown",
        },

        "Simulated monitoring alert created incident"
      );

      res.status(201).json({
        ...incident,

        affectedServices:
          (incident?.affectedServices as string[]) ||
          [],

        suggestedCommands:
          (incident?.suggestedCommands as string[]) ||
          [],

        createdAt:
          incident?.createdAt?.toISOString?.() ||
          null,

        updatedAt:
          incident?.updatedAt?.toISOString?.() ||
          null,

        resolvedAt:
          incident?.resolvedAt?.toISOString?.() ||
          null,

        source:
          template?.source ||
          "Unknown",

        metric:
          template?.metric ||
          "unknown",

        value:
          template?.value ||
          "unknown",
      });

      generateRCA({
        title:
          template?.title ||
          "Unknown Incident",

        description:
          template?.description ||
          "No description",

        affectedServices:
          template?.affectedServices ||
          [],

        severity:
          template?.severity ||
          "MEDIUM",
      })
        .then(async (analysis) => {
          await db
            .update(incidentsTable)
            .set({
              rootCause:
                analysis?.rootCause ||
                "Unknown",

              aiAnalysis:
                analysis?.humanExplanation ||
                "No analysis",

              confidence:
                analysis?.confidence ||
                50,

              suggestedCommands:
                analysis?.suggestedCommands ||
                [],

              updatedAt:
                new Date(),
            })

            .where(
              eq(
                incidentsTable.id,
                incident?.id || 0
              )
            );

          logger.info(
            {
              incidentId:
                incident?.id,
            },

            "Background RCA saved for simulated incident"
          );
        })

        .catch((err) => {
          logger.error(
            {
              err,
              incidentId:
                incident?.id,
            },

            "Background RCA generation failed"
          );
        });
    } catch (err) {
      logger.error(
        { err },
        "Failed to simulate monitoring alert"
      );

      res.status(500).json({
        error:
          "Failed to create incident from alert",
      });
    }
  }
);

export default router;