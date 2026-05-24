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

type Status =
  | "available"
  | "busy"
  | "on-call"
  | "offline";

type TaskType =
  | "incident"
  | "feature"
  | "maintenance";

type Priority =
  | "critical"
  | "high"
  | "medium"
  | "low";

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
    id: "demo",
    name: "Demo User",
    role: "SRE Engineer",
    initials: "DU",
    color: "bg-primary",
    status: "available",
    expertise: [
      "Monitoring",
      "Alerting",
      "On-Call",
    ],
    resolvedCount: 14,
    mttr: "26 min",
    currentTasks: [
      {
        id: "t1",
        title:
          "Dashboard alert refinement",
        type: "maintenance",
        priority: "medium",
        since: "Today",
        description:
          "Reviewing dashboard alert thresholds.",
      },
    ],
    recentFixes: [
      {
        title:
          "Reduced alert noise",
        date: "3 days ago",
        impact:
          "False positives reduced by 35%",
      },
    ],
  },
];

const STATUS_CONFIG: Record<
  Status,
  {
    label: string;
    color: string;
    dot: string;
  }
> = {
  available: {
    label: "Available",
    color: "text-green-400",
    dot: "bg-green-400",
  },

  busy: {
    label: "Busy",
    color: "text-yellow-400",
    dot: "bg-yellow-400",
  },

  "on-call": {
    label: "On-Call",
    color: "text-red-400",
    dot: "bg-red-400 animate-blink",
  },

  offline: {
    label: "Offline",
    color:
      "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const PRIORITY_BADGE: Record<
  Priority,
  string
> = {
  critical:
    "bg-red-500/20 text-red-400 border-red-500/30",

  high:
    "bg-orange-500/20 text-orange-400 border-orange-500/30",

  medium:
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",

  low:
    "bg-muted/50 text-muted-foreground border-border",
};

const TASK_ICON: Record<
  TaskType,
  React.ReactNode
> = {
  incident: (
    <ShieldAlert className="h-3.5 w-3.5" />
  ),

  feature: (
    <GitPullRequest className="h-3.5 w-3.5" />
  ),

  maintenance: (
    <Wrench className="h-3.5 w-3.5" />
  ),
};

function MemberModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const status =
    STATUS_CONFIG?.[
      member?.status ||
        "available"
    ];

  const safeExpertise =
    Array.isArray(
      member?.expertise
    )
      ? member.expertise
      : [];

  const safeTasks =
    Array.isArray(
      member?.currentTasks
    )
      ? member.currentTasks
      : [];

  const safeFixes =
    Array.isArray(
      member?.recentFixes
    )
      ? member.recentFixes
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl glass-card rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${
                member?.color ||
                "bg-primary"
              } flex items-center justify-center text-white font-bold text-xl`}
            >
              {member?.initials ||
                "NA"}
            </div>

            <div>
              <h2 className="text-xl font-bold">
                {member?.name ||
                  "Unknown"}
              </h2>

              <p className="text-muted-foreground text-sm">
                {member?.role ||
                  "Unknown"}
              </p>

              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.dot || ""
                  }`}
                />

                <span
                  className={`text-xs font-medium ${
                    status?.color || ""
                  }`}
                >
                  {status?.label ||
                    "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-primary">
                {member?.resolvedCount ||
                  0}
              </div>

              <div className="text-xs text-muted-foreground mt-0.5">
                Incidents Resolved
              </div>
            </div>

            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-green-400">
                {member?.mttr ||
                  "0 min"}
              </div>

              <div className="text-xs text-muted-foreground mt-0.5">
                Avg MTTR
              </div>
            </div>

            <div className="glass-card rounded-xl p-3 border border-border text-center">
              <div className="text-2xl font-bold text-secondary">
                {
                  safeTasks.length
                }
              </div>

              <div className="text-xs text-muted-foreground mt-0.5">
                Active Tasks
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Expertise
            </h3>

            <div className="flex flex-wrap gap-2">
              {safeExpertise.map(
                (e, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary"
                  >
                    {e}
                  </span>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Current Tasks
            </h3>

            <div className="space-y-3">
              {safeTasks.map(
                (task) => (
                  <div
                    key={
                      task?.id
                    }
                    className="p-3 rounded-xl border border-border bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-primary">
                          {TASK_ICON?.[
                            task?.type ||
                              "maintenance"
                          ]}
                        </span>

                        {task?.title ||
                          "Untitled"}
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                          PRIORITY_BADGE?.[
                            task?.priority ||
                              "low"
                          ]
                        }`}
                      >
                        {task?.priority ||
                          "low"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {task?.description ||
                        "No description"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recent Fixes
            </h3>

            <div className="space-y-2">
              {safeFixes.map(
                (fix, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl border border-border bg-muted/20"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fix?.title ||
                          "Unknown"}
                      </p>

                      <p className="text-xs text-green-400/80 mt-0.5">
                        {fix?.impact ||
                          "No impact"}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground/60">
                          {fix?.date ||
                            "Unknown"}
                        </span>

                        {fix?.incidentRef && (
                          <span className="text-xs text-primary font-mono">
                            {
                              fix.incidentRef
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  onClick,
}: {
  member: Member;
  onClick: () => void;
}) {
  const status =
    STATUS_CONFIG?.[
      member?.status ||
        "available"
    ];

  const safeTasks =
    Array.isArray(
      member?.currentTasks
    )
      ? member.currentTasks
      : [];

  const activeCritical =
    safeTasks.filter(
      (t) =>
        t?.priority ===
        "critical"
    ).length;

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${
            member?.color ||
            "bg-primary"
          } flex items-center justify-center text-white font-bold text-lg shrink-0`}
        >
          {member?.initials ||
            "NA"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight">
                {member?.name ||
                  "Unknown"}
              </h3>

              <p className="text-xs text-muted-foreground">
                {member?.role ||
                  "Unknown"}
              </p>
            </div>

            {activeCritical >
              0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium shrink-0">
                P1
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status?.dot || ""
              }`}
            />

            <span
              className={`text-xs ${
                status?.color || ""
              }`}
            >
              {status?.label ||
                "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {safeTasks
          .slice(0, 2)
          .map((task) => (
            <div
              key={task?.id}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="text-primary shrink-0">
                {TASK_ICON?.[
                  task?.type ||
                    "maintenance"
                ]}
              </span>

              <span className="truncate">
                {task?.title ||
                  "Untitled"}
              </span>
            </div>
          ))}

        {safeTasks.length ===
          0 && (
          <p className="text-xs text-muted-foreground/60 italic">
            Available for
            assignment
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-400" />

            {member?.resolvedCount ||
              0}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />

            {member?.mttr ||
              "0 min"}
          </span>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [selected, setSelected] =
    useState<Member | null>(
      null
    );

  const [filter, setFilter] =
    useState<
      | "all"
      | "on-call"
      | "busy"
      | "available"
    >("all");

  const safeTeam =
    Array.isArray(TEAM)
      ? TEAM
      : [];

  const filtered =
    filter === "all"
      ? safeTeam
      : safeTeam.filter(
          (m) =>
            m?.status ===
            filter
        );

  const workItems = safeTeam
    .flatMap((m) =>
      Array.isArray(
        m?.currentTasks
      )
        ? m.currentTasks.map(
            (t) => ({
              ...t,
              member: m,
            })
          )
        : []
    )
    .sort((a, b) => {
      const order: Priority[] =
        [
          "critical",
          "high",
          "medium",
          "low",
        ];

      return (
        order.indexOf(
          a?.priority ||
            "low"
        ) -
        order.indexOf(
          b?.priority ||
            "low"
        )
      );
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
              <h1 className="text-2xl font-bold tracking-tight">
                Team
              </h1>

              <p className="text-muted-foreground text-sm">
                Who's working
                on what
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(
              [
                "all",
                "on-call",
                "busy",
                "available",
              ] as const
            ).map((f) => (
              <Button
                key={f}
                variant={
                  filter === f
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                onClick={() =>
                  setFilter(f)
                }
                className={cn(
                  "text-xs capitalize",
                  filter === f &&
                    "bg-primary/20 text-primary"
                )}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(
            (member) => (
              <MemberCard
                key={
                  member?.id
                }
                member={
                  member
                }
                onClick={() =>
                  setSelected(
                    member
                  )
                }
              />
            )
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />

            Active Work Board
          </h2>

          <div className="glass-card rounded-xl border border-border overflow-hidden">
            {workItems.map(
              (item) => (
                <div
                  key={`${item?.member?.id}-${item?.id}`}
                  className="grid grid-cols-[1fr_140px_100px_80px] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer items-center"
                  onClick={() =>
                    setSelected(
                      item?.member
                    )
                  }
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item?.title ||
                        "Untitled"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      Since{" "}
                      {item?.since ||
                        "Unknown"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        item
                          ?.member
                          ?.color ||
                        "bg-primary"
                      } flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                    >
                      {
                        item
                          ?.member
                          ?.initials
                      }
                    </div>

                    <span className="text-xs truncate">
                      {item
                        ?.member
                        ?.name ||
                        "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {
                      TASK_ICON?.[
                        item?.type ||
                          "maintenance"
                      ]
                    }

                    <span className="capitalize">
                      {item?.type ||
                        "task"}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium w-fit capitalize ${
                      PRIORITY_BADGE?.[
                        item?.priority ||
                          "low"
                      ]
                    }`}
                  >
                    {item?.priority ||
                      "low"}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {selected && (
        <MemberModal
          member={selected}
          onClose={() =>
            setSelected(
              null
            )
          }
        />
      )}
    </MainLayout>
  );
}