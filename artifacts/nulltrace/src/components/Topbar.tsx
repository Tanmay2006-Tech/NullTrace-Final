import { Bell, Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetHealthScore, getGetHealthScoreQueryKey, useListIncidents } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Topbar() {
  const [, setLocation] = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { user } = useUser();
  const { signOut } = useClerk();

  const { data: healthData } = useGetHealthScore({ query: { queryKey: getGetHealthScoreQueryKey() } });
  const { data: incidents } = useListIncidents(undefined, {
    query: { refetchInterval: 30000 },
  });

  const score = healthData?.score || 100;
  const scoreColor = score >= 85 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-red-500";

  const openCount = Array.isArray(incidents)
    ? incidents.filter((i: { status: string; severity: string }) =>
        (i.status === "OPEN" || i.status === "INVESTIGATING") &&
        (i.severity === "CRITICAL" || i.severity === "HIGH")
      ).length
    : 0;

  const handleSignOut = () => {
    setShowProfile(false);
    signOut({ redirectUrl: basePath || "/" });
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !searchValue.trim()) return;
    const lower = searchValue.toLowerCase();
    if (lower.includes("incident") || lower.includes("alert") || lower.includes("outage")) {
      setLocation("/incidents");
    } else if (lower.includes("log")) {
      setLocation("/logs");
    } else if (lower.includes("service") || lower.includes("pod") || lower.includes("deploy")) {
      setLocation("/services");
    } else if (lower.includes("metric") || lower.includes("cpu") || lower.includes("memory") || lower.includes("latency")) {
      setLocation("/metrics");
    } else if (lower.includes("team") || lower.includes("member") || lower.includes("assign")) {
      setLocation("/team");
    } else {
      setLocation("/ai-chat");
    }
    setSearchValue("");
  };

  const displayName = user
    ? (user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailAddresses?.[0]?.emailAddress || "User")
    : "User";

  const displayEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center w-96 relative">
        <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search incidents, logs, services… (Enter)"
          className="pl-9 bg-muted/50 border-none focus-visible:ring-primary/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
          <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Health</div>
          <div className={`font-mono font-bold ${scoreColor}`}>{score}%</div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setLocation("/incidents")}
          title="View open incidents"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {openCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-blink">
              {openCount > 9 ? "9+" : openCount}
            </span>
          )}
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowProfile((p) => !p)}
            title="Profile"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary">
              {initials || <User className="h-4 w-4" />}
            </div>
          </Button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border shadow-2xl z-50 overflow-hidden" style={{ backgroundColor: "#0f0f1a" }}>
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                </div>
                <button
                  onClick={() => { setShowProfile(false); setLocation("/team"); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-foreground"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  My Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
