import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5 border border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              404
            </h1>

            <p className="text-lg font-semibold mt-2 text-foreground">
              Page Not Found
            </p>

            <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
              The page you are looking for does not exist or may have been moved.
            </p>

            <div className="mt-6 flex gap-3">
              <Link href="/">
                <Button className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}