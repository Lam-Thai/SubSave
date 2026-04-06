"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HealthPayload = {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSec: number;
  version: string;
  checks: {
    database: {
      status: "ok" | "error";
      latencyMs?: number;
    };
  };
};

function formatUptime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function SystemHealthCard() {
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Health check failed");
        }
        const json = (await res.json()) as HealthPayload;
        if (alive) {
          setPayload(json);
        }
      } catch {
        if (alive) {
          setPayload(null);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchHealth();
    const interval = window.setInterval(fetchHealth, 30_000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  const meta = useMemo(() => {
    if (!payload) {
      return {
        title: "Unavailable",
        description: "Could not load runtime health",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        icon: AlertTriangle,
      };
    }

    if (payload.status === "ok") {
      return {
        title: "All systems operational",
        description: `DB ${payload.checks.database.latencyMs ?? "?"}ms • Uptime ${formatUptime(payload.uptimeSec)}`,
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        icon: Activity,
      };
    }

    return {
      title: "Degraded",
      description: "Database check is failing",
      badgeClass: "border-red-500/30 bg-red-500/10 text-red-300",
      icon: AlertTriangle,
    };
  }, [payload]);

  const Icon = meta.icon;

  return (
    <Card className="card-glow hover-lift reveal-up reveal-delay-5 border-border bg-card">
      <CardHeader className="pb-2">
        <CardDescription className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          System health
        </CardDescription>
        <CardTitle className="text-xl text-foreground">
          {loading ? "Checking..." : meta.title}
        </CardTitle>
        <span
          className={`mt-1 inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
        >
          {payload?.status ?? "unknown"}
        </span>
        <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
      </CardHeader>
    </Card>
  );
}
