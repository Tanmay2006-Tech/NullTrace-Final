import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Terminal, Zap, ArrowRight } from "lucide-react";
import logo from "/logo.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <header className="relative z-10 container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="NullTrace" className="h-8 w-auto" />
          <span className="font-bold text-xl tracking-tight text-foreground">NullTrace</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground neon-border-blue">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-blink" />
          Incident Intelligence Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60">
          The War Room for Modern DevOps Teams
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
          Instantly diagnose root causes, correlate logs with metrics, and resolve incidents with confidence — before your users notice.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-in">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground neon-border-blue group">
              Enter Dashboard
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-card hover:bg-card/80 border-border">
              <Terminal className="mr-2 h-4 w-4" /> Create Account
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
          <div className="p-6 rounded-2xl glass-card relative group hover:neon-border-blue transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Instant Root Cause Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Correlates metrics, traces, and logs across your microservices to pinpoint the exact root cause in seconds — not hours.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card relative group hover:neon-border-purple transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 text-secondary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Proactive Anomaly Detection</h3>
            <p className="text-muted-foreground text-sm">
              Catch regressions before they become incidents. NullTrace learns your baseline and surfaces meaningful deviations early.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card relative group hover:neon-border-blue transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Remediation As Code</h3>
            <p className="text-muted-foreground text-sm">
              Receive context-aware kubectl commands and scripts to resolve each incident immediately — directly from the incident view.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NullTrace. All rights reserved.
      </footer>
    </div>
  );
}
