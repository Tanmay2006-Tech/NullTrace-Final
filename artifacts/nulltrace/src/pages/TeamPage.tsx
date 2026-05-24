import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  GitPullRequest,
  Wrench,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "available" | "busy" | "on-call" | "offline";
type TaskType = "incident" | "feature" | "maintenance";
type Priority = "critical" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  since: string;
  description: string;
}

interface Fix {
  title: string;
  date: string;
  impact: string;
  incidentRef?: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: Status;
  expertise: string[];
  currentTasks: Task[];
  recentFixes: Fix[];
  resolvedCount: number;
  mttr: string;
}

const TEAM: Member[] = [
  {
    id: "alex",
    name: "Alex Chen",
    role: "Senior SRE",
    initials: "AC",
    color: "bg-blue-500",
    status: "on-call",
    expertise: ["Kubernetes", "PostgreSQL", "Incident Command"],
    resolvedCount: 47,
    mttr: "12 min",
    currentTasks: [
      {
        id: "t1",
        title: "PostgreSQL failover automation",
        type: "feature",
        priority: "high",
        since: "2 days ago",
        description: "Building automated failover scripts for primary DB using pg_auto_failover. Do not duplicate — contact Alex.",
      },
      {
        id: "t2",
        title: "INC-001 — Connection pool exhaustion",
        type: "incident",
        priority: "critical",
        since: "3 hours ago",
        description: "Actively investigating and mitigating the PostgreSQL connection pool exhaustion incident.",
      },
    ],
    recentFixes: [
      { title: "Fixed API gateway timeout mis-configuration", date: "Yesterday", impact: "Reduced p99 latency by 340ms", incidentRef: "INC-998" },
      { title: "Resolved Kubernetes node NotReady state", date: "3 days ago", impact: "Restored 3 worker nodes", incidentRef: "INC-994" },
      { title: "Patched PVC capacity alert thresholds", date: "1 week ago", impact: "Early detection at 75% disk usage" },
    ],
  },
  {
    id: "sarah",
    name: "Sarah Kim",
    role: "DevOps Engineer",
    initials: "SK",
    color: "bg-violet-500",
    status: "busy",
    expertise: ["CI/CD", "Helm", "Monitoring", "Terraform"],
    resolvedCount: 31,
    mttr: "18 min",
    currentTasks: [
      {
        id: "t3",
        title: "Kubernetes HPA tuning — checkout-service",
        type: "maintenance",
        priority: "high",
        since: "1 day ago",
        description: "Tuning horizontal pod autoscaler rules to reduce latency spikes under burst traffic. Assigned to Sarah — do not modify HPA configs.",
      },
      {
        id: "t4",
        title: "Helm chart upgrade — service-mesh v1.18",
        type: "maintenance",
        priority: "medium",
        since: "4 days ago",
        description: "Upgrading Istio service mesh. Breaking change review in progress.",
      },
    ],
    recentFixes: [
      { title: "Fixed auth-service memory leak (Go goroutine)", date: "2 days ago", impact: "Memory usage down 61%", incidentRef: "INC-999" },
      { title: "Fixed flapping Prometheus alert rule", date: "5 days ago", impact: "Alert noise reduced by 80%" },
      { title: "Patched container image with CVE-2024-3094", date: "2 weeks ago", impact: "Security vulnerability closed" },
    ],
  },
  {
    id: "raj",
    name: "Raj Patel",
    role: "Platform Engineer",
    initials: "RP",
    color: "bg-emerald-500",
    status: "available",
    expertise: ["Service Mesh", "Observability", "Go", "eBPF"],
    resolvedCount: 28,
    mttr: "22 min",
    currentTasks: [
      {
        id: "t5",
        title: "Distributed tracing — OpenTelemetry rollout",
        type: "feature",
        priority: "medium",
        since: "3 days ago",
        description: "Instrumenting all microservices with OTEL SDK. Raj owns this — coordinate before adding new instrumentation.",
      },
    ],
    recentFixes: [
      { title: "Resolved service mesh mTLS handshake failures", date: "4 days ago", impact: "Zero-downtime cert rotation now works", incidentRef: "INC-991" },
      { title: "Fixed Jaeger trace sampling config", date: "1 week ago", impact: "100% of critical path traces now captured" },
      { title: "Optimized eBPF network policy rules", date: "2 weeks ago", impact: "East-west latency reduced by 28ms" },
    ],
  },
  {
    id: "maya",
    name: "Maya Rodriguez",
    role: "SRE Lead",
    initials: "MR",
    color: "bg-orange-500",
    status: "busy",
    expertise: ["Incident Management", "SLO/SLA", "Capacity Planning", "AWS"],
    resolvedCount: 89,
    mttr: "9 min",
    currentTasks: [
      {
        id: "t6",
        title: "Q2 SLO review and adjustment",
        type: "feature",
        priority: "high",
        since: "5 days ago",
        description: "Reviewing and updating SLO targets across all services. Coordinating with product team.",
      },
      {
        id: "t7",
        title: "INC-001 — Incident command",
        type: "incident",
        priority: "critical",
        since: "3 hours ago",
        description: "Incident commander for the ongoing P1 connection pool exhaustion. All comms go through Maya.",
      },
    ],
    recentFixes: [
      { title: "Designed and implemented automated rollback pipeline", date: "1 week ago", impact: "MTTR reduced by 40% for bad deploys" },
      { title: "Fixed log aggregation pipeline data loss", date: "2 weeks ago", impact: "100% log delivery restored", incidentRef: "INC-985" },
      { title: "Resolved cross-region DNS failover issue", date: "3 weeks ago", impact: "RTO improved from 8 min to 90 sec" },
    ],
  },
  {
    id: "demo",
    name: "Demo User",
    role: "SRE Engineer",
    initials: "DU",
    color: "bg-primary",
    status: "available",
    expertise: ["Monitoring", "Alerting", "On-Call"],
    resolvedCount: 14,
    mttr: "26 min",
    currentTasks: [
      {
        id: "t8",
        title: "Dashboard monitoring alert refinement",
        type: "maintenance",
        priority: "medium",
        since: "Today",
        description: "Reviewing and refining NullTrace dashboard alert thresholds to reduce false positives.",
      },
    ],
    recentFixes: [
      { title: "Tuned alert thresholds to reduce noise by 35%", date: "3 days ago", impact: "On-call pages reduced from 24 to 8/day" },
      { title: "Updated runbook for DB connection pool incidents", date: "1 week ago", impact: "Faster triage for P1 DB incidents" },
    ],
  },
];

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-green-400", dot: "bg-green-400" },
  busy: { label: "Busy", color: "text-yellow-400", dot: "bg-yellow-400" },
  "on-call": { label: "On-Call", color: "text-red-400", dot: "bg-red-400 animate-blink" },
  offline: { label: "Offline", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const PRIORITY_BADGE: Record<Priority, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-muted/50 text-muted-foreground border-border",
};

const TASK_ICON: Record<TaskType, React.ReactNode> = {
  incident: <ShieldAlert className="h-3.5 w-3.5" />,
  feature: <GitPullRequest className="h-3.5 w-3.5" />,
  maintenance: <Wrench className="h-3.5 w-3.5" />,
};

function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const status = STATUS_CONFIG[member.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl glass-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${member.color} flex items-center justify-center text-white font-bold text-xl`}>
              {member.initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-muted-foreground text-sm">{member.role}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-primary">{member.resolvedCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Incidents Resolved</div>
            </div>
            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-green-400">{member.mttr}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Avg MTTR</div>
            </div>
            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-secondary">{member.currentTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Active Tasks</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((e) => (
                <span key={e} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary">
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Currently Working On
            </h3>
            <div className="space-y-3">
              {member.currentTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-primary">{TASK_ICON[task.type]}</span>
                      {task.title}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${PRIORITY_BADGE[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1.5">Started {task.since}</p>
                </div>
              ))}
              {member.currentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No active tasks — available for assignment</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Recent Fixes & Contributions
            </h3>
            <div className="space-y-2">
              {member.recentFixes.map((fix, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-muted/20">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{fix.title}</p>
                    <p className="text-xs text-green-400/80 mt-0.5">{fix.impact}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground/60">{fix.date}</span>
                      {fix.incidentRef && (
                        <span className="text-xs text-primary font-mono">{fix.incidentRef}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, onClick }: { member: Member; onClick: () => void }) {
  const status = STATUS_CONFIG[member.status];
  const activeCritical = member.currentTasks.filter((t) => t.priority === "critical").length;

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl ${member.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight">{member.name}</h3>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            {activeCritical > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium shrink-0">
                P1
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className={`text-xs ${status.color}`}>{status.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {member.currentTasks.slice(0, 2).map((task) => (
          <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-primary shrink-0">{TASK_ICON[task.type]}</span>
            <span className="truncate">{task.title}</span>
          </div>
        ))}
        {member.currentTasks.length === 0 && (
          <p className="text-xs text-muted-foreground/60 italic">Available for assignment</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-400" /> {member.resolvedCount}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> {member.mttr}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [selected, setSelected] = useState<Member | null>(null);
  const [filter, setFilter] = useState<"all" | "on-call" | "busy" | "available">("all");

  const filtered = filter === "all" ? TEAM : TEAM.filter((m) => m.status === filter);

  const workItems = TEAM.flatMap((m) =>
    m.currentTasks.map((t) => ({ ...t, member: m }))
  ).sort((a, b) => {
    const order: Priority[] = ["critical", "high", "medium", "low"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Team</h1>
              <p className="text-muted-foreground text-sm">Who's working on what — prevent duplicate effort</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(["all", "on-call", "busy", "available"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className={cn("text-xs capitalize", filter === f && "bg-primary/20 text-primary")}
              >
                {f === "all" ? "All" : f}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} onClick={() => setSelected(member)} />
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Active Work Board
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-normal">
              {workItems.length} tasks
            </span>
          </h2>
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_140px_100px_80px] gap-4 px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Task</span>
              <span>Assigned To</span>
              <span>Type</span>
              <span>Priority</span>
            </div>
            {workItems.map((item) => (
              <div
                key={`${item.member.id}-${item.id}`}
                className="grid grid-cols-[1fr_140px_100px_80px] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer items-center"
                onClick={() => setSelected(item.member)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Since {item.since}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${item.member.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {item.member.initials}
                  </div>
                  <span className="text-xs truncate">{item.member.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {TASK_ICON[item.type]}
                  <span className="capitalize">{item.type}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium w-fit capitalize ${PRIORITY_BADGE[item.priority]}`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} />}
    </MainLayout>
  );
}
