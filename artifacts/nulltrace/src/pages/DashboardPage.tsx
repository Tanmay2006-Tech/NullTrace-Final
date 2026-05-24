import { MainLayout } from "@/components/MainLayout";

import {
  useGetIncidentSummary,
  getGetIncidentSummaryQueryKey,

  useGetHealthScore,
  getGetHealthScoreQueryKey,

  useGetAiInsights,
  getGetAiInsightsQueryKey,

  useListServices,
  getListServicesQueryKey,

  useGetHeatmap,
  getGetHeatmapQueryKey,
} from "@workspace/api-client-react";

import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Activity,
  BrainCircuit,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";

export default function DashboardPage() {
  const {
    data: summary,
    isLoading: isSummaryLoading,
  } = useGetIncidentSummary({
    query: {
      queryKey:
        getGetIncidentSummaryQueryKey?.() ||
        [],
    },
  });

  const {
    data: healthData,
    isLoading: isHealthLoading,
  } = useGetHealthScore({
    query: {
      queryKey:
        getGetHealthScoreQueryKey?.() ||
        [],
    },
  });

  const {
    data: insights,
    isLoading: isInsightsLoading,
  } = useGetAiInsights({
    query: {
      queryKey:
        getGetAiInsightsQueryKey?.() ||
        [],
    },
  });

  const {
    data: services,
    isLoading: isServicesLoading,
  } = useListServices({
    query: {
      queryKey:
        getListServicesQueryKey?.() ||
        [],

      refetchInterval: 10000,
    },
  });

  const {
    data: heatmap,
    isLoading: isHeatmapLoading,
  } = useGetHeatmap({
    query: {
      queryKey:
        getGetHeatmapQueryKey?.() ||
        [],
    },
  });

  const score =
    healthData?.score || 100;

  const scoreColor =
    score >= 85
      ? "text-green-500"
      : score >= 70
      ? "text-yellow-500"
      : "text-red-500";

  const incidentSeverity =
    summary?.incident?.severity ||
    "MEDIUM";

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">
          System Overview
        </h1>

        {isSummaryLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : summary ? (
          <div
            className={`glass-card rounded-xl p-6 ${
              incidentSeverity ===
              "CRITICAL"
                ? "neon-border-red"
                : incidentSeverity ===
                  "HIGH"
                ? "neon-border-orange"
                : incidentSeverity ===
                  "MEDIUM"
                ? "neon-border-yellow"
                : "neon-border-blue"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    {summary?.incident
                      ?.title ||
                      "Unknown Incident"}
                  </h2>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        incidentSeverity ===
                        "CRITICAL"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {incidentSeverity}
                    </Badge>

                    <span className="text-sm text-muted-foreground">
                      Confidence:{" "}
                      {summary?.analysis
                        ?.confidence || 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <Badge
                variant="outline"
                className="bg-background/50 backdrop-blur"
              >
                AI RCA Complete
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Root Cause
                </h3>

                <p className="text-foreground">
                  {summary?.analysis
                    ?.rootCause ||
                    "No root cause available"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.isArray(
                    summary?.analysis
                      ?.affectedServices
                  ) &&
                  summary.analysis
                    .affectedServices
                    .length > 0 ? (
                    summary.analysis.affectedServices.map(
                      (svc: string) => (
                        <Badge
                          key={svc}
                          variant="outline"
                          className="bg-card"
                        >
                          <Cpu className="h-3 w-3 mr-1" />
                          {svc}
                        </Badge>
                      )
                    )
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-card"
                    >
                      No services
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-black/90 rounded-lg p-4 border border-border font-mono text-sm relative group">
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                  Suggested Fix
                </div>

                <div className="text-green-400 mt-4 space-y-1">
                  {Array.isArray(
                    summary?.analysis
                      ?.suggestedCommands
                  ) &&
                  summary.analysis
                    .suggestedCommands
                    .length > 0 ? (
                    summary.analysis.suggestedCommands.map(
                      (
                        cmd: string,
                        i: number
                      ) => (
                        <div key={i}>
                          <span className="text-muted-foreground select-none">
                            $
                          </span>{" "}
                          {cmd}
                        </div>
                      )
                    )
                  ) : (
                    <div>
                      No commands
                      available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />

            <h2 className="text-xl font-bold mb-2">
              Systems Healthy
            </h2>

            <p className="text-muted-foreground">
              No critical incidents
              require attention at this
              time.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 border border-border flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 self-start w-full">
              System Health
            </h3>

            {isHealthLoading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : (
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />

                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={
                      2 *
                      Math.PI *
                      56
                    }
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      56 *
                      (1 -
                        score /
                          100)
                    }
                    className={`${scoreColor} transition-all duration-1000 ease-in-out`}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-3xl font-bold ${scoreColor}`}
                  >
                    {score}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-6 border border-border md:col-span-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              Latest AI Insights
            </h3>

            <div className="space-y-3">
              {isInsightsLoading ? (
                Array.from({
                  length: 3,
                }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full rounded"
                  />
                ))
              ) : Array.isArray(
                  insights
                ) &&
                insights.length >
                  0 ? (
                insights
                  .slice(0, 3)
                  .map(
                    (
                      insight: any
                    ) => (
                      <div
                        key={
                          insight?.id ||
                          Math.random()
                        }
                        className="flex gap-3 items-center bg-background/40 p-3 rounded border border-border"
                      >
                        <div className="p-1.5 bg-primary/10 rounded text-primary shrink-0">
                          <Activity className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate text-foreground">
                            {insight?.message ||
                              "No message"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {insight?.service ||
                              "Unknown"}{" "}
                            •{" "}
                            {insight?.timestamp
                              ? format(
                                  new Date(
                                    insight.timestamp
                                  ),
                                  "h:mm a"
                                )
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    )
                  )
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent
                  insights.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}