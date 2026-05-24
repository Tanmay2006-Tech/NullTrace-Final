import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { useLink } from "wouter";

interface LiveAlert {
  id: string;
  title: string;
  source: string;
  severity: string;
  service: string;
  incidentId?: number;
  timestamp: number;
}

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "border-red-500/50 bg-red-950/80 text-red-200",
  HIGH: "border-orange-500/50 bg-orange-950/80 text-orange-200",
  MEDIUM: "border-yellow-500/50 bg-yellow-950/80 text-yellow-200",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-black",
};

function AlertCard({ alert, onDismiss }: { alert: LiveAlert; onDismiss: () => void }) {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.MEDIUM;
  const badge = SEVERITY_BADGE[alert.severity] ?? SEVERITY_BADGE.MEDIUM;

  return (
    <div
      className={`relative flex flex-col gap-1.5 p-4 rounded-xl border backdrop-blur-md shadow-2xl min-w-[320px] max-w-[380px] animate-in slide-in-from-right-5 fade-in duration-300 ${style}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 opacity-80" />
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${badge}`}>
            {alert.severity}
          </span>
          <span className="text-xs font-mono opacity-60 truncate">{alert.source}</span>
        </div>
        <button
          onClick={onDismiss}
          className="opacity-50 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm font-semibold leading-snug pr-2">{alert.title}</p>
      <p className="text-xs opacity-70">Service: {alert.service}</p>

      {alert.incidentId && (
        <a
          href={`/incidents/${alert.incidentId}`}
          className="mt-1 inline-flex items-center gap-1 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
        >
          View incident #{alert.incidentId} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

export function AlertToaster() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const seenIds = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const autoFire = async () => {
    try {
      const res = await fetch("/api/monitoring/simulate", { method: "POST" });
      if (!res.ok) return;
      const incident = await res.json();

      if (seenIds.current.has(incident.id)) return;
      seenIds.current.add(incident.id);

      const alert: LiveAlert = {
        id: `toast-${incident.id}-${Date.now()}`,
        title: incident.title,
        source: incident.source ?? "Monitor",
        severity: incident.severity,
        service: (incident.affectedServices as string[])[0] ?? "unknown",
        incidentId: incident.id,
        timestamp: Date.now(),
      };

      setAlerts((prev) => [alert, ...prev].slice(0, 5));

      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 12000);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      autoFire();
    }, 8000);

    intervalRef.current = setInterval(() => {
      autoFire();
    }, 45000);

    return () => {
      clearTimeout(delay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <AlertCard alert={alert} onDismiss={() => dismiss(alert.id)} />
        </div>
      ))}
    </div>
  );
}
