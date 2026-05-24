import { MainLayout } from "@/components/MainLayout";
import { useListLogs, getListLogsQueryKey } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Play, Pause, TerminalSquare, Filter } from "lucide-react";
import { format } from "date-fns";

export default function LogsPage() {
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: logs } = useListLogs(
    { level, limit: 200 },
    { query: { queryKey: getListLogsQueryKey({ level }), refetchInterval: isPaused ? false : 3000 } }
  );

  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(lower) ||
      log.service.toLowerCase().includes(lower) ||
      log.level.toLowerCase().includes(lower)
    );
  });

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, isPaused]);

  const LEVEL_COLOR: Record<string, string> = {
    ERROR: "text-red-400",
    FATAL: "text-red-500 font-bold",
    WARN: "text-yellow-400",
    INFO: "text-blue-400",
    DEBUG: "text-slate-400",
  };

  const LEVEL_BADGE: Record<string, string> = {
    ERROR: "bg-red-500/20 text-red-400 border-red-500/30",
    FATAL: "bg-red-700/30 text-red-300 border-red-700/40",
    WARN: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    DEBUG: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const counts = logs?.reduce<Record<string, number>>((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <MainLayout>
      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <TerminalSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Live Logs</h1>
              <p className="text-muted-foreground text-sm">
                {filteredLogs?.length ?? 0} entries
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["ERROR", "WARN", "INFO"].map((lvl) => (
              <Badge
                key={lvl}
                variant="outline"
                className={`text-xs cursor-pointer ${LEVEL_BADGE[lvl]} ${level === lvl ? "ring-1 ring-current" : ""}`}
                onClick={() => setLevel(level === lvl ? undefined : lvl)}
              >
                {lvl} {counts[lvl] ? `(${counts[lvl]})` : ""}
              </Badge>
            ))}

            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)} className="border-border gap-1.5">
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>

            <Select value={level || "ALL"} onValueChange={(v) => setLevel(v === "ALL" ? undefined : v)}>
              <SelectTrigger className="w-[110px] bg-background/50 border-border h-8 text-xs">
                <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="FATAL">FATAL</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-52">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by message or service…"
                className="pl-8 h-8 text-xs bg-background/50 border-border"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 glass-card rounded-xl border border-border bg-black/90 overflow-hidden flex flex-col font-mono text-sm shadow-2xl">
          <div className="bg-muted/10 px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-yellow-500" : "bg-green-500 animate-blink"}`} />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {isPaused ? "Paused" : "Live Stream"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-foreground transition-colors"
                >
                  ✕ Clear filter
                </button>
              )}
              <span>{filteredLogs?.length ?? 0} lines</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 scroll-smooth">
            {filteredLogs?.map((log) => (
              <div
                key={log.id}
                className={`flex gap-3 group hover:bg-white/5 px-2 py-0.5 rounded transition-colors items-start ${
                  log.isAnomaly ? "bg-primary/10 border-l-2 border-primary pl-1" : ""
                }`}
              >
                <span className="text-muted-foreground/60 shrink-0 select-none text-xs mt-0.5 w-20">
                  {format(new Date(log.timestamp), "HH:mm:ss.SS")}
                </span>
                <span className={`w-12 shrink-0 font-bold text-xs mt-0.5 ${LEVEL_COLOR[log.level] ?? "text-gray-400"}`}>
                  {log.level}
                </span>
                <span className="text-primary/60 shrink-0 w-28 truncate text-xs mt-0.5" title={log.service}>
                  [{log.service}]
                </span>
                <span
                  className={`flex-1 break-all text-xs leading-relaxed ${
                    log.level === "ERROR" || log.level === "FATAL"
                      ? "text-red-300"
                      : log.level === "WARN"
                      ? "text-yellow-200/80"
                      : "text-slate-300"
                  }`}
                >
                  {searchTerm
                    ? log.message.split(new RegExp(`(${searchTerm})`, "gi")).map((part, i) =>
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                          <mark key={i} className="bg-primary/30 text-primary rounded px-0.5">
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )
                    : log.message}
                </span>
                {log.traceId && (
                  <span className="text-muted-foreground/40 shrink-0 text-[10px] mt-0.5 font-mono">
                    {log.traceId.slice(0, 8)}
                  </span>
                )}
              </div>
            ))}

            {filteredLogs?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-sm">No logs match your filter</p>
                <button
                  onClick={() => { setSearchTerm(""); setLevel(undefined); }}
                  className="text-xs text-primary mt-2 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {!isPaused && (filteredLogs?.length ?? 0) > 0 && (
              <div className="flex gap-3 px-2 py-1">
                <span className="w-2 h-4 bg-muted-foreground/60 animate-blink inline-block mt-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
