import { MainLayout } from "@/components/MainLayout";

import {
  useGetMetrics,
  getGetMetricsQueryKey,
} from "@workspace/api-client-react";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

import { format } from "date-fns";

export default function MetricsPage() {
  const [range, setRange] =
    useState<"1h" | "6h" | "24h">(
      "1h"
    );

  const {
    data: metrics,
    isLoading,
  } = useGetMetrics(
    { range },
    {
      query: {
        queryKey:
          getGetMetricsQueryKey({
            range,
          }),

        refetchInterval: 10000,
      },
    }
  );

  const safeMetrics =
    metrics || {};

  const safeCpu = Array.isArray(
    safeMetrics?.cpu
  )
    ? safeMetrics.cpu
    : [];

  const safeMemory =
    Array.isArray(
      safeMetrics?.memory
    )
      ? safeMetrics.memory
      : [];

  const safeLatency =
    Array.isArray(
      safeMetrics?.latency
    )
      ? safeMetrics.latency
      : [];

  const safeErrorRate =
    Array.isArray(
      safeMetrics?.errorRate
    )
      ? safeMetrics.errorRate
      : [];

  const sanitizeChartData = (
    data: any[]
  ) => {
    return Array.isArray(data)
      ? data.map((item) => ({
          timestamp:
            item?.timestamp ||
            new Date().toISOString(),

          value:
            Number(item?.value) ||
            0,
        }))
      : [];
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: any) => {
    if (
      active &&
      Array.isArray(payload) &&
      payload.length > 0
    ) {
      const value = Number(
        payload?.[0]?.value
      );

      return (
        <div className="glass-card p-3 rounded-lg border border-border text-sm">
          <p className="text-muted-foreground mb-1">
            {label
              ? format(
                  new Date(label),
                  "h:mm:ss a"
                )
              : "Unknown"}
          </p>

          <p className="font-mono font-bold text-primary">
            {isNaN(value)
              ? "0.00"
              : value.toFixed(2)}{" "}
            {payload?.[0]?.unit ||
              ""}
          </p>
        </div>
      );
    }

    return null;
  };

  const ChartCard = ({
    title,
    data,
    dataKey,
    color,
    unit = "",
  }: any) => {
    const safeData =
      sanitizeChartData(data);

    return (
      <div className="glass-card rounded-xl p-5 border border-border">
        <h3 className="font-bold mb-4 text-foreground">
          {title || "Chart"}
        </h3>

        <div className="h-[250px] w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-md" />
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={safeData}
                margin={{
                  top: 5,
                  right: 0,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id={`gradient-${dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={
                        color
                      }
                      stopOpacity={
                        0.3
                      }
                    />

                    <stop
                      offset="95%"
                      stopColor={
                        color
                      }
                      stopOpacity={
                        0
                      }
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />

                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(
                    val
                  ) =>
                    val
                      ? format(
                          new Date(
                            val
                          ),
                          "h:mm a"
                        )
                      : "--"
                  }
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickMargin={10}
                />

                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(
                    val
                  ) =>
                    `${val}${unit}`
                  }
                />

                <Tooltip
                  content={
                    <CustomTooltip />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${dataKey})`}
                  isAnimationActive={
                    false
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Metrics
            </h1>

            <p className="text-muted-foreground text-sm mt-1">
              Aggregated
              telemetry across
              all clusters
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-blink" />

              Live
            </div>

            <Select
              value={range}
              onValueChange={(
                val: any
              ) =>
                setRange(val)
              }
            >
              <SelectTrigger className="w-[120px] bg-background/50 border-border">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="1h">
                  Last 1 Hour
                </SelectItem>

                <SelectItem value="6h">
                  Last 6 Hours
                </SelectItem>

                <SelectItem value="24h">
                  Last 24 Hours
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="CPU Utilization"
            data={safeCpu}
            dataKey="cpu"
            color="hsl(var(--primary))"
            unit="%"
          />

          <ChartCard
            title="Memory Usage"
            data={safeMemory}
            dataKey="memory"
            color="hsl(var(--secondary))"
            unit="%"
          />

          <ChartCard
            title="P99 Latency"
            data={safeLatency}
            dataKey="latency"
            color="hsl(var(--chart-4))"
            unit="ms"
          />

          <ChartCard
            title="Error Rate"
            data={safeErrorRate}
            dataKey="errorRate"
            color="hsl(var(--destructive))"
            unit="%"
          />
        </div>
      </div>
    </MainLayout>
  );
}