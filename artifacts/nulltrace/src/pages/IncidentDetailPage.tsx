import { useParams } from "wouter";
import { MainLayout } from "@/components/MainLayout";
import { useGetIncident, getGetIncidentQueryKey, useGetIncidentTimeline, getGetIncidentTimelineQueryKey, useAnalyzeIncident } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BrainCircuit, Copy, Cpu, Clock, Terminal, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function IncidentDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();

  const { data: incident, isLoading: isIncidentLoading, refetch } = useGetIncident(id, {
    query: { enabled: !!id, queryKey: getGetIncidentQueryKey(id), refetchInterval: 5000 },
  });

  const { data: timeline, isLoading: isTimelineLoading } = useGetIncidentTimeline(id, {
    query: { enabled: !!id, queryKey: getGetIncidentTimelineQueryKey(id) },
  });

  const analyzeMutation = useAnalyzeIncident();

  useEffect(() => {
    if (incident && !incident.rootCause && !analyzeMutation.isPending) {
      analyzeMutation.mutate({ id }, {
        onSuccess: () => refetch(),
      });
    }
  }, [incident?.id, incident?.rootCause]);

  const handleAnalyze = () => {
    analyzeMutation.mutate({ id }, {
      onSuccess: () => {
        refetch();
        toast({ title: "Analysis Complete", description: "Root cause analysis updated." });
      },
    });
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "CRITICAL": return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
      case "HIGH": return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">High</Badge>;
      case "MEDIUM": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Medium</Badge>;
      case "LOW": return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Low</Badge>;
      default: return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const isAnalyzing = analyzeMutation.isPending || (!!incident && !incident.rootCause && isIncidentLoading === false);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-muted-foreground text-sm">INC-{id}</span>
              {getSeverityBadge(incident?.severity)}
              <Badge variant="outline">{incident?.status}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{incident?.title || <Skeleton className="h-8 w-64" />}</h1>
            <p className="text-muted-foreground mt-2">{incident?.description || <Skeleton className="h-4 w-96 mt-2" />}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
              {analyzeMutation.isPending ? "Analyzing…" : "Re-run Analysis"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-xl p-6 border border-primary/20 neon-border-blue relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <BrainCircuit className="h-32 w-32 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                <BrainCircuit className="h-5 w-5" /> Root Cause Analysis
              </h2>

              {isIncidentLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : isAnalyzing && !incident?.rootCause ? (
                <div className="flex items-center gap-3 text-muted-foreground py-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm">Running analysis…</span>
                </div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Root Cause</h3>
                    <p className="text-foreground leading-relaxed">{incident?.rootCause || "No root cause identified yet."}</p>
                  </div>
                  {incident?.aiAnalysis && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explanation</h3>
                      <p className="text-muted-foreground leading-relaxed">{incident.aiAnalysis}</p>
                    </div>
                  )}
                  {incident?.confidence != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Confidence:</span>
                      <span className="text-primary font-mono font-bold">{incident.confidence}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Suggested Remediation</span>
                </div>
              </div>
              <div className="p-4 bg-black/90 font-mono text-sm space-y-2">
                {incident?.suggestedCommands?.map((cmd, i) => (
                  <div key={i} className="flex items-start group">
                    <span className="text-muted-foreground select-none mr-3 mt-0.5">$</span>
                    <code className="text-green-400 flex-1 break-all">{cmd}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(cmd);
                        toast({ title: "Copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {!incident?.suggestedCommands?.length && (
                  <div className="text-muted-foreground italic">
                    {isAnalyzing ? "Generating remediation commands…" : "No commands suggested yet."}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-muted-foreground" /> Affected Services
              </h2>
              <div className="flex flex-wrap gap-2">
                {incident?.affectedServices?.map((svc) => (
                  <Badge key={svc} variant="outline" className="bg-background/50 py-1.5 px-3">
                    {svc}
                  </Badge>
                ))}
                {!incident?.affectedServices?.length && (
                  <span className="text-muted-foreground text-sm">None identified</span>
                )}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" /> Timeline
              </h2>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {isTimelineLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0">
                        <Skeleton className="h-3 w-3 rounded-full" />
                      </div>
                      <div className="flex-1 glass-card p-3 rounded-xl border border-border">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))
                ) : (
                  timeline?.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border bg-background shadow shrink-0 ${
                          event.type === "DETECTION"
                            ? "border-red-500/50 text-red-500"
                            : event.type === "RESOLUTION"
                            ? "border-green-500/50 text-green-500"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <div className="flex-1 glass-card p-3 rounded-xl border border-border">
                        <div className="text-sm font-medium mb-1 text-foreground">{event.event}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(event.timestamp), "MMM d, h:mm a")}</span>
                          {event.service && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-mono">{event.service}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
