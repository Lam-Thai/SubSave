"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

interface UsageInsight {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  monthlyUsageCount: number;
  costPerUse: number | null;
}

interface UsageValueMeterProps {
  refreshToken?: number;
}

export function UsageValueMeter({ refreshToken = 0 }: UsageValueMeterProps) {
  const [insights, setInsights] = useState<UsageInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"costPerUse" | "costVsUsage">("costPerUse");

  useEffect(() => {
    setLoading(true);
    fetch("/api/insights/usage")
      .then((res) => (res.ok ? res.json() : { insights: [] }))
      .then((data) => setInsights(data.insights ?? []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [refreshToken]);

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
  const chartData = withUsage
    .slice()
    .sort((a, b) => (b.costPerUse ?? 0) - (a.costPerUse ?? 0))
    .slice(0, 8)
    .map((i) => ({
      ...i,
      shortName: i.name.length > 16 ? `${i.name.slice(0, 16)}...` : i.name,
    }));

  const dualChartData = insights
    .slice()
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .slice(0, 8)
    .map((i) => ({
      ...i,
      shortName: i.name.length > 16 ? `${i.name.slice(0, 16)}...` : i.name,
    }));

  return (
    <Card className="card-glow rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Usage & value
        </CardTitle>
        <CardDescription>
          Compare cost efficiency and usage activity across your subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No subscriptions yet. Add your first subscription to start tracking usage value.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={view === "costPerUse" ? "default" : "outline"}
                className={view === "costPerUse" ? "btn-gradient rounded-lg" : "rounded-lg"}
                onClick={() => setView("costPerUse")}
              >
                Cost per use
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === "costVsUsage" ? "default" : "outline"}
                className={view === "costVsUsage" ? "btn-gradient rounded-lg" : "rounded-lg"}
                onClick={() => setView("costVsUsage")}
              >
                Monthly cost vs usage
              </Button>
            </div>

            {view === "costPerUse" ? (
              withUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add &quot;Times used this month&quot; in Edit for any subscription to see cost-per-use insights.
                </p>
              ) : (
                <>
                  <div className="h-72 w-full rounded-lg border border-border bg-background/40 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={52}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={{ stroke: "hsl(var(--border))" }}
                          tickLine={false}
                          tickFormatter={(value) => formatCurrency(Number(value))}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.75rem",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number, _name, payload) => {
                            const row = payload?.payload as UsageInsight | undefined;
                            if (!row) return [formatCurrency(Number(value)), "Cost / use"];
                            return [
                              `${formatCurrency(Number(value))} per use`,
                              `${row.monthlyUsageCount} use${row.monthlyUsageCount === 1 ? "" : "s"}`,
                            ];
                          }}
                          labelFormatter={(_label, payload) => {
                            const row = payload?.[0]?.payload as UsageInsight | undefined;
                            if (!row) return "Subscription";
                            return `${row.name} (${formatCurrency(row.monthlyCost)} monthly)`;
                          }}
                        />
                        <Bar dataKey="costPerUse" radius={[8, 8, 0, 0]}>
                          {chartData.map((item, index) => (
                            <Cell
                              key={`${item.id}-${index}`}
                              fill={index === 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Showing up to 8 subscriptions with usage data. Highest cost-per-use is highlighted.
                  </p>
                </>
              )
            ) : (
              <>
                <div className="h-72 w-full rounded-lg border border-border bg-background/40 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dualChartData} margin={{ top: 8, right: 18, left: 8, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                        height={52}
                      />
                      <YAxis
                        yAxisId="usage"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="cost"
                        orientation="right"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number, name) => {
                          if (name === "Monthly cost") {
                            return [formatCurrency(Number(value)), name];
                          }
                          return [
                            `${Number(value)} use${Number(value) === 1 ? "" : "s"}`,
                            name,
                          ];
                        }}
                        labelFormatter={(_label, payload) => {
                          const row = payload?.[0]?.payload as UsageInsight | undefined;
                          return row?.name ?? "Subscription";
                        }}
                      />
                      <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                      <Bar
                        yAxisId="usage"
                        dataKey="monthlyUsageCount"
                        name="Usage count"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="cost"
                        type="monotone"
                        dataKey="monthlyCost"
                        name="Monthly cost"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2.25}
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs text-muted-foreground">
                  Showing up to 8 subscriptions sorted by monthly cost. Bars show usage count, line shows monthly cost.
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
