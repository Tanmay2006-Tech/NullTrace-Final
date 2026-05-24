import { MainLayout } from "@/components/MainLayout";

import {
  useListServices,
  getListServicesQueryKey,

  useListPods,
  getListPodsQueryKey,
} from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Cpu,
  Server,
  Activity,
} from "lucide-react";

export default function ServicesPage() {
  const {
    data: services,
    isLoading: isServicesLoading,
  } = useListServices({
    query: {
      queryKey:
        getListServicesQueryKey(),

      refetchInterval: 10000,
    },
  });

  const {
    data: pods,
    isLoading: isPodsLoading,
  } = useListPods({
    query: {
      queryKey:
        getListPodsQueryKey(),

      refetchInterval: 10000,
    },
  });

  const safeServices =
    Array.isArray(services)
      ? services
      : [];

  const safePods =
    Array.isArray(pods)
      ? pods
      : [];

  const getStatusBadge = (
    status?: string
  ) => {
    switch (status) {
      case "HEALTHY":
        return (
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-500 bg-green-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink mr-1.5" />
            Healthy
          </Badge>
        );

      case "DEGRADED":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500/30 text-yellow-500 bg-yellow-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-blink mr-1.5" />
            Degraded
          </Badge>
        );

      case "DOWN":
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 text-red-500 bg-red-500/10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-blink mr-1.5" />
            Down
          </Badge>
        );

      default:
        return (
          <Badge variant="secondary">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Services Map
            </h1>

            <p className="text-muted-foreground text-sm mt-1">
              Live health overview of all microservices
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-blink" />

            Live sync active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isServicesLoading ? (
            Array.from({
              length: 6,
            }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-48 rounded-xl"
              />
            ))
          ) : safeServices.length ===
            0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No services available
            </div>
          ) : (
            safeServices.map(
              (service: any) => {
                const svcPods =
                  safePods.filter(
                    (p: any) =>
                      p?.service ===
                      service?.name
                  ) || [];

                const cpu =
                  Number(
                    service?.cpu
                  ) || 0;

                const memory =
                  Number(
                    service?.memory
                  ) || 0;

                const latency =
                  Number(
                    service?.latency
                  ) || 0;

                const errorRate =
                  Number(
                    service?.errorRate
                  ) || 0;

                const replicas =
                  Number(
                    service?.replicas
                  ) || 0;

                return (
                  <div
                    key={
                      service?.id ||
                      Math.random()
                    }
                    className={`glass-card rounded-xl p-5 border transition-all duration-300 hover:neon-border-blue ${
                      service?.status ===
                      "DOWN"
                        ? "border-red-500/50"
                        : service?.status ===
                          "DEGRADED"
                        ? "border-yellow-500/50"
                        : "border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">
                          {service?.name ||
                            "Unknown Service"}
                        </h3>

                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          {service?.namespace ||
                            "default"}
                        </div>
                      </div>

                      {getStatusBadge(
                        service?.status
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-background/50 rounded-lg p-3 border border-border">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center">
                          <Cpu className="w-3 h-3 mr-1" />

                          CPU
                        </div>

                        <div className="flex items-end gap-1.5">
                          <span className="font-mono text-lg font-bold">
                            {cpu}%
                          </span>
                        </div>

                        <div className="w-full bg-muted mt-2 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              cpu > 80
                                ? "bg-red-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(
                                cpu,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-background/50 rounded-lg p-3 border border-border">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center">
                          <Server className="w-3 h-3 mr-1" />

                          Memory
                        </div>

                        <div className="flex items-end gap-1.5">
                          <span className="font-mono text-lg font-bold">
                            {memory}%
                          </span>
                        </div>

                        <div className="w-full bg-muted mt-2 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              memory >
                              80
                                ? "bg-red-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(
                                memory,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Latency
                        </span>

                        <span className="font-mono text-sm font-medium">
                          {latency}
                          ms
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Errors
                        </span>

                        <span
                          className={`font-mono text-sm font-medium ${
                            errorRate >
                            5
                              ? "text-red-400"
                              : ""
                          }`}
                        >
                          {errorRate}%
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Pods
                        </span>

                        <span className="font-mono text-sm font-medium">
                          {replicas}
                        </span>
                      </div>
                    </div>

                    {svcPods.length >
                      0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                          Active Pods
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {svcPods.map(
                            (
                              pod: any,
                              idx: number
                            ) => (
                              <Badge
                                key={
                                  pod?.id ||
                                  idx
                                }
                                variant="secondary"
                                className="font-mono text-[10px]"
                              >
                                {pod?.name ||
                                  "unknown-pod"}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}