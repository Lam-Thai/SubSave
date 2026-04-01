"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { Subscription } from "./dashboard-client";

interface TrialAlert {
  id: string;
  name: string;
  monthlyCost: number;
  trialEndsAt: string;
  daysLeft: number;
  message: string;
}

export function TrialTrapDetector({ subscriptions }: { subscriptions: Subscription[] }) {
  const alerts = useMemo<TrialAlert[]>(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 14);

    return subscriptions
      .filter((sub) => {
        if (!sub.trialEndsAt) return false;
        const trialEnd = new Date(sub.trialEndsAt);
        return trialEnd >= now && trialEnd <= cutoff;
      })
      .sort((a, b) => {
        const aTime = new Date(a.trialEndsAt as string).getTime();
        const bTime = new Date(b.trialEndsAt as string).getTime();
        return aTime - bTime;
      })
      .map((sub) => {
        const trialEnd = new Date(sub.trialEndsAt as string);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: sub.id,
          name: sub.name,
          monthlyCost: sub.monthlyCost,
          trialEndsAt: trialEnd.toISOString(),
          daysLeft,
          message: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"} - avoid a $${sub.monthlyCost.toFixed(2)} charge.`,
        };
      });
  }, [subscriptions]);

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
