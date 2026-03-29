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
import { BarChart3 } from "lucide-react";

interface UsageInsight {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  monthlyUsageCount: number;
  costPerUse: number | null;
}

export function UsageValueMeter() {
  const [insights, setInsights] = useState<UsageInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights/usage")
      .then((res) => (res.ok ? res.json() : { insights: [] }))
      .then((data) => setInsights(data.insights ?? []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="card-glow rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="h-5 w-5 text-primary" />
            Usage & value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const withUsage = insights.filter((i) => i.costPerUse != null);

  return (
    <Card className="card-glow rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Usage & value
        </CardTitle>
        <CardDescription>
          Cost per use based on how often you use each subscription this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subscriptions yet. Add your first subscription to start tracking usage value.
          </p>
        ) : withUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add &quot;Times used this month&quot; in Edit for any subscription to see cost-per-use insights.
          </p>
        ) : (
          <ul className="space-y-2">
            {withUsage.map((i) => (
              <li
                key={i.id}
                className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{i.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — You paid {formatCurrency(i.monthlyCost)} and used it {i.monthlyUsageCount} time
                  {i.monthlyUsageCount === 1 ? "" : "s"} this month (
                  <span className="text-primary font-medium">
                    {formatCurrency(i.costPerUse!)} per use
                  </span>
                  ).
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
