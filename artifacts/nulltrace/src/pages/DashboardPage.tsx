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
  getGetHeatmapQueryKey
} from "@workspace/api-client-react";
import { AlertTriangle, CheckCircle2, Cpu, Terminal, Activity, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useGetIncidentSummary({
    query: { queryKey: getGetIncidentSummaryQueryKey() }
  });

  const { data: healthData, isLoading: isHealthLoading } = useGetHealthScore({
    query: { queryKey: getGetHealthScoreQueryKey() }
  });

  const { data: insights, isLoading: isInsightsLoading } = useGetAiInsights({
    query: { queryKey: getGetAiInsightsQueryKey() }
  });

  const { data: services, isLoading: isServicesLoading } = useListServices({
    query: { queryKey: getListServicesQueryKey(), refetchInterval: 10000 }
  });

  const { data: heatmap, isLoading: isHeatmapLoading } = useGetHeatmap({
    query: { queryKey: getGetHeatmapQueryKey() }
  });

  const scoreColor = (healthData?.score || 100) >= 85 ? "text-green-500" : (healthData?.score || 100) >= 70 ? "text-yellow-500" : "text-red-500";

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
        
        {/* RCA Card */}
        {isSummaryLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : summary ? (
          <div className={`glass-card rounded-xl p-6 ${
            summary.incident.severity === 'CRITICAL' ? 'neon-border-red' :
            summary.incident.severity === 'HIGH' ? 'neon-border-orange' :
            summary.incident.severity === 'MEDIUM' ? 'neon-border-yellow' : 'neon-border-blue'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{summary.incident.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      summary.incident.severity === 'CRITICAL' ? 'destructive' : 'secondary'
                    }>
                      {summary.incident.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Confidence: {summary.analysis.confidence}%</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="bg-background/50 backdrop-blur">
                AI RCA Complete
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-background/50 rounded-lg p-4 border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Root Cause</h3>
                <p className="text-foreground">{summary.analysis.rootCause}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.analysis.affectedServices.map(svc => (
                    <Badge key={svc} variant="outline" className="bg-card">
                      <Cpu className="h-3 w-3 mr-1" /> {svc}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/90 rounded-lg p-4 border border-border font-mono text-sm relative group">
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">Suggested Fix</div>
                <div className="text-green-400 mt-4 space-y-1">
                  {summary.analysis.suggestedCommands.map((cmd, i) => (
                    <div key={i}><span className="text-muted-foreground select-none">$</span> {cmd}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Systems Healthy</h2>
            <p className="text-muted-foreground">No critical incidents require attention at this time.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score */}
          <div className="glass-card rounded-xl p-6 border border-border flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 self-start w-full">System Health</h3>
            {isHealthLoading ? (
               <Skeleton className="h-32 w-32 rounded-full" />
            ) : (
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 56} 
                    strokeDashoffset={2 * Math.PI * 56 * (1 - (healthData?.score || 0) / 100)} 
                    className={`${scoreColor} transition-all duration-1000 ease-in-out`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${scoreColor}`}>{healthData?.score}%</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="glass-card rounded-xl p-6 border border-border md:col-span-2">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" /> Latest AI Insights
             </h3>
             <div className="space-y-3">
               {isInsightsLoading ? (
                 Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)
               ) : (
                 insights?.slice(0, 3).map(insight => (
                   <div key={insight.id} className="flex gap-3 items-center bg-background/40 p-3 rounded border border-border">
                      <div className="p-1.5 bg-primary/10 rounded text-primary shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate text-foreground">{insight.message}</p>
                        <p className="text-xs text-muted-foreground">{insight.service} • {format(new Date(insight.timestamp), "h:mm a")}</p>
                      </div>
                   </div>
                 ))
               )}
               {!isInsightsLoading && (!insights || insights.length === 0) && (
                 <div className="text-sm text-muted-foreground text-center py-4">No recent insights.</div>
               )}
             </div>
          </div>
        </div>

        {/* Heatmap & Services Grid Snippet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="glass-card rounded-xl p-6 border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Incident Heatmap (24h)</h3>
              {isHeatmapLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="h-48 flex items-center justify-center bg-background/30 rounded border border-border overflow-auto p-2 text-xs text-muted-foreground">
                   {/* Fallback visual for heatmap if Recharts Heatmap is not readily available in typical Recharts without heavy config */}
                   <div className="grid grid-cols-[auto_1fr] gap-2 w-full">
                     {heatmap && [...new Set(heatmap.map(h => h.service))].slice(0,5).map(service => (
                       <div key={service} className="contents">
                         <div className="truncate w-24 text-right pr-2">{service}</div>
                         <div className="flex gap-1">
                           {Array.from({length: 24}).map((_, hour) => {
                             const entry = heatmap.find(h => h.service === service && h.hour === hour);
                             const bg = entry ? (entry.severity === 'CRITICAL' ? 'bg-red-500' : entry.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500') : 'bg-muted';
                             return <div key={hour} className={`flex-1 h-4 rounded-sm ${bg}`} title={`${hour}:00 - ${entry?.incidentCount || 0} incidents`} />
                           })}
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
           </div>

           <div className="glass-card rounded-xl p-6 border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Service Status</h3>
              <div className="space-y-3">
                {isServicesLoading ? (
                  Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)
                ) : (
                  services?.slice(0, 5).map(service => (
                    <div key={service.id} className="flex items-center justify-between bg-background/40 p-2.5 rounded border border-border">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${service.status === 'HEALTHY' ? 'bg-green-500' : service.status === 'DEGRADED' ? 'bg-yellow-500' : 'bg-red-500'} ${service.status !== 'HEALTHY' ? 'animate-blink' : ''}`} />
                        <span className="font-medium text-sm">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span>{service.cpu}% CPU</span>
                        <span>{service.latency}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>

      </div>
    </MainLayout>
  );
}
