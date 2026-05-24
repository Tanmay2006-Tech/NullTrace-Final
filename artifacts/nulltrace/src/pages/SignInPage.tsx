import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "/logo.png";

const DEMO_EMAIL = "demo@nulltrace.io";
const DEMO_PASSWORD = "demo1234";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setLocation("/dashboard");
    } else {
      setError("Invalid credentials. Use the demo account below.");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-primary/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-8 glass-card rounded-2xl border border-border shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="NullTrace" className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-foreground">NullTrace</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access the war room</p>
        </div>

        {/* Demo credentials banner */}
        <div
          className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group"
          onClick={fillDemo}
          title="Click to auto-fill demo credentials"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Demo Account</span>
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Click to auto-fill →</span>
          </div>
          <div className="space-y-1 font-mono text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Email:</span>
              <span className="text-foreground">{DEMO_EMAIL}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20">Password:</span>
              <span className="text-foreground">{DEMO_PASSWORD}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="demo@nulltrace.io"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              required
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              className="bg-background/50"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground neon-border-blue h-11">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              ← Back to home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
