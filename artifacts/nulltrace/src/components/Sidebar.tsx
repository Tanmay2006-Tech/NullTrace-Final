import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  BarChart2,
  Cpu,
  LayoutDashboard,
  MessageSquare,
  TerminalSquare,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logo from "/logo.png";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/services", label: "Services", icon: Cpu },
  { href: "/metrics", label: "Metrics", icon: BarChart2 },
  { href: "/logs", label: "Logs", icon: TerminalSquare },
  { href: "/ai-chat", label: "Intelligence", icon: MessageSquare },
  { href: "/team", label: "Team", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar h-full flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border gap-2">
        <Link href="/" className="flex items-center gap-2">
          <img src={logo} alt="NullTrace" className="h-7 w-auto cursor-pointer" />
          <span className="font-bold text-base tracking-tight text-sidebar-foreground">NullTrace</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium neon-border-blue border-l-2"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-blink mr-2" />
          System Online
        </div>
      </div>
    </div>
  );
}
