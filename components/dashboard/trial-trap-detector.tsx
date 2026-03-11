"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface TrialAlert {
  id: string;
  name: string;
  monthlyCost: number;
  trialEndsAt: string;
  daysLeft: number;
  message: string;
}

export function TrialTrapDetector() {
  const [alerts, setAlerts] = useState<TrialAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/trials")
      .then((res) => (res.ok ? res.json() : { alerts: [] }))
      .then((data) => setAlerts(data.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="card-glow rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Trial alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="card-glow rounded-xl border-border bg-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Trial trap detector
        </CardTitle>
        <CardDescription>
          Free trials ending in the next 14 days — cancel in time to avoid charges
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
          >
            <p className="font-medium text-foreground">{a.name}</p>
            <p className="text-sm text-muted-foreground">{a.message}</p>
            <p className="text-xs text-muted-foreground">
              Trial ends {new Date(a.trialEndsAt).toLocaleDateString()} · {formatCurrency(a.monthlyCost)}/mo after
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
