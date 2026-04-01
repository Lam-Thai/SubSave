"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, getBillingDateLabel } from "@/lib/utils";
import { SubscriptionForm } from "@/components/dashboard/subscription-form";
import { SubscriptionList } from "@/components/dashboard/subscription-list";
import {
  CalendarClock,
  CircleDollarSign,
  Plus,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import Image from "next/image";

const UsageValueMeter = dynamic(
  () => import("@/components/dashboard/usage-value-meter").then((mod) => mod.UsageValueMeter),
);

const TrialTrapDetector = dynamic(
  () => import("@/components/dashboard/trial-trap-detector").then((mod) => mod.TrialTrapDetector),
);

const SharingOptimizer = dynamic(
  () => import("@/components/dashboard/sharing-optimizer").then((mod) => mod.SharingOptimizer),
);

const AppChatbox = dynamic(
  () => import("@/components/dashboard/app-chatbox").then((mod) => mod.AppChatbox),
);

export interface Subscription {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  billingDate: number;
  trialEndsAt: string | null;
  monthlyUsageCount: number;
  createdAt: string;
}

interface ApiResponse {
  subscriptions: Subscription[];
  totalMonthly: number;
}

interface DashboardClientProps {
  initialData: ApiResponse;
}

function getDaysUntilBillingDay(day: number): number {
  const now = new Date();
  const currentDay = now.getDate();

  if (day >= currentDay) {
    return day - currentDay;
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return daysInMonth - currentDay + day;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<ApiResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const previousAnimatedTotalRef = useRef(0);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSaved() {
    setFormOpen(false);
    setEditingId(null);
    fetchSubscriptions();
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  const totalMonthly = data.totalMonthly;
  const subscriptions = data.subscriptions;
  const averageMonthly = subscriptions.length > 0 ? totalMonthly / subscriptions.length : 0;

  const trialsEndingSoon = subscriptions.filter((s) => {
    if (!s.trialEndsAt) return false;
    const trialDate = new Date(s.trialEndsAt);
    const now = new Date();
    const days = Math.ceil((trialDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  }).length;

  const upcomingBillings = subscriptions
    .map((sub) => ({
      ...sub,
      daysUntil: getDaysUntilBillingDay(sub.billingDate),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  useEffect(() => {
    if (loading) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setAnimatedTotal(totalMonthly);
      previousAnimatedTotalRef.current = totalMonthly;
      return;
    }

    const durationMs = 800;
    const start = previousAnimatedTotalRef.current;
    const end = totalMonthly;
    const delta = end - start;
    const startTime = performance.now();
    let frameId = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      const next = start + delta * eased;
      setAnimatedTotal(next);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        previousAnimatedTotalRef.current = end;
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loading, totalMonthly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="sr-only">Loading subscriptions…</span>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-8">
      <div className="reveal-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscriptions and monthly spending
          </p>
        </div>
      </div>

      <Card className="card-glow hover-lift reveal-up reveal-delay-1 overflow-hidden border-border bg-card">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Smart subscription command center
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Turn recurring costs into clear, actionable insights.
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              SubSave helps you track expenses, catch trial traps, and optimize value per use with visual analytics designed for fast decisions.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={() => {
                  document.getElementById("subscriptions-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="btn-gradient rounded-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add subscription
              </Button>
              <Button
                variant="outline"
                className="rounded-lg border-border"
                onClick={() => {
                  document.getElementById("usage-insights")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                <Target className="mr-2 h-4 w-4" />
                Optimize spending
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <Image
              src="/dashboard-spotlight.svg"
              alt="SubSave dashboard preview"
              width={640}
              height={360}
              priority
              className="reveal-up w-full rounded-2xl border border-border/80 shadow-[0_12px_35px_-18px_hsl(160_84%_39%_/_0.45)]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="card-glow hover-lift reveal-up reveal-delay-2 border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-primary" />
              Active subscriptions
            </CardDescription>
            <CardTitle className="text-2xl text-foreground">{subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="card-glow hover-lift reveal-up reveal-delay-3 border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-primary" />
              Average monthly cost
            </CardDescription>
            <CardTitle className="text-2xl text-foreground">{formatCurrency(averageMonthly)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="card-glow hover-lift reveal-up reveal-delay-4 border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Trials ending in 7 days
            </CardDescription>
            <CardTitle className="text-2xl text-foreground">{trialsEndingSoon}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="card-glow hover-lift reveal-up reveal-delay-5 border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Spending outlook
            </CardDescription>
            <CardTitle className="text-2xl text-foreground">
              {totalMonthly > 0 ? "Tracked" : "Start now"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="card-glow hover-lift reveal-up overflow-hidden rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Total monthly cost</CardTitle>
          <CardDescription>
            Sum of all subscription costs this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold gradient-text">
            {formatCurrency(animatedTotal)}
          </p>
        </CardContent>
      </Card>

      <div className="reveal-up reveal-delay-2">
        <TrialTrapDetector subscriptions={subscriptions} />
      </div>

      <Card className="card-glow hover-lift reveal-up reveal-delay-3 rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming billing timeline
          </CardTitle>
          <CardDescription>
            Your next subscription charges, sorted by nearest billing day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBillings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add subscriptions to unlock your billing timeline.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcomingBillings.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getBillingDateLabel(sub.billingDate)} • {formatCurrency(sub.monthlyCost)}
                    </p>
                  </div>
                  <span className="ml-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    {sub.daysUntil === 0
                      ? "Today"
                      : `In ${sub.daysUntil} day${sub.daysUntil === 1 ? "" : "s"}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div id="usage-insights" className="reveal-up reveal-delay-3">
        <UsageValueMeter subscriptions={subscriptions} />
      </div>

      <div className="reveal-up reveal-delay-4">
        <AppChatbox />
      </div>

      <Card
        id="subscriptions-section"
        className="card-glow hover-lift reveal-up reveal-delay-5 rounded-xl border-border bg-card"
      >
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground">Subscriptions</CardTitle>
              <CardDescription>
                {subscriptions.length === 0
                  ? "Add your first subscription to get started"
                  : `${subscriptions.length} subscription${subscriptions.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormOpen(true);
              }}
              className="btn-gradient rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add subscription
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleEdit}
            onDeleted={fetchSubscriptions}
          />
        </CardContent>
      </Card>

      <div className="reveal-up reveal-delay-6">
        <SharingOptimizer />
      </div>

      <SubscriptionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
        subscriptionId={editingId}
        subscriptions={subscriptions}
      />
    </div>
  );
}
