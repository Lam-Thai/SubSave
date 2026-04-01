"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

interface DemoStep {
  id: string;
  title: string;
  description: string;
  targetId: string;
}

interface DemoPopupPosition {
  top: number;
  left: number;
}

interface DemoPopupArrow {
  side: "left" | "right" | "top";
  offset: number;
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
  const searchParams = useSearchParams();
  const [data, setData] = useState<ApiResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [demoPopupPosition, setDemoPopupPosition] = useState<DemoPopupPosition>({ top: 80, left: 24 });
  const [demoPopupArrow, setDemoPopupArrow] = useState<DemoPopupArrow>({ side: "left", offset: 56 });
  const previousAnimatedTotalRef = useRef(0);
  const demoStartedFromQueryRef = useRef(false);

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

  const hasTrialAlerts = subscriptions.some((s) => {
    if (!s.trialEndsAt) return false;
    const trialDate = new Date(s.trialEndsAt);
    const now = new Date();
    const days = Math.ceil((trialDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 14;
  });

  const upcomingBillings = subscriptions
    .map((sub) => ({
      ...sub,
      daysUntil: getDaysUntilBillingDay(sub.billingDate),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const demoSteps: DemoStep[] = useMemo(
    () => [
      {
        id: "hero",
        title: "Hero command center",
        description:
          "This is your starting point. Use quick actions here to add a subscription or jump straight to optimization insights.",
        targetId: "hero-command-center",
      },
      {
        id: "total-monthly",
        title: "Total monthly cost",
        description:
          "This card summarizes your monthly recurring spend. Watch this number to quickly track progress when canceling or downgrading plans.",
        targetId: "total-monthly-section",
      },
      {
        id: "billing-timeline",
        title: "Upcoming billing timeline",
        description:
          "See what gets charged next so you can decide ahead of time whether to keep, pause, or cancel subscriptions.",
        targetId: "billing-timeline-section",
      },
      ...(hasTrialAlerts
        ? [
            {
              id: "trial-trap",
              title: "Trial trap detector",
              description:
                "This section warns you when trials are about to end so you can avoid surprise renewals.",
              targetId: "trial-trap-section",
            },
          ]
        : []),
      {
        id: "usage-value",
        title: "Usage and value insights",
        description:
          "Compare cost per use and monthly cost vs usage. It helps you spot low-value subscriptions fast.",
        targetId: "usage-insights",
      },
      {
        id: "sharing",
        title: "Sharing optimizer",
        description:
          "Create trusted circles to identify duplicated services and estimate savings from sharing family plans.",
        targetId: "sharing-optimizer-section",
      },
      {
        id: "subscriptions",
        title: "Subscriptions list",
        description:
          "Manage your subscriptions here. Add, edit, and delete entries while tracking billing date, trial end, and usage.",
        targetId: "subscriptions-section",
      },
      {
        id: "chat",
        title: "AI assistant",
        description:
          "Ask app-related questions, request savings strategies, and get guidance on using each section effectively.",
        targetId: "ai-chat-section",
      },
    ],
    [hasTrialAlerts],
  );

  const startDemo = useCallback(
    (stepIndex = 0) => {
      if (demoSteps.length === 0) return;
      const safeStepIndex = Math.max(0, Math.min(stepIndex, demoSteps.length - 1));
      setDemoStepIndex(safeStepIndex);
      setDemoOpen(true);
    },
    [demoSteps.length],
  );

  function goToNextStep() {
    setDemoStepIndex((prev) => Math.min(prev + 1, demoSteps.length - 1));
  }

  function goToPreviousStep() {
    setDemoStepIndex((prev) => Math.max(prev - 1, 0));
  }

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

  useEffect(() => {
    if (searchParams.get("demo") === "1" && !demoStartedFromQueryRef.current) {
      demoStartedFromQueryRef.current = true;
      startDemo(0);
    }
  }, [searchParams, startDemo]);

  useEffect(() => {
    if (!demoOpen) return;
    const step = demoSteps[demoStepIndex];
    if (!step) return;

    const target = document.getElementById(step.targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [demoOpen, demoStepIndex, demoSteps]);

  useEffect(() => {
    if (!demoOpen) return;

    const step = demoSteps[demoStepIndex];
    if (!step) return;

    const updateDemoPopupPosition = () => {
      const target = document.getElementById(step.targetId);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const popupWidth = 420;
      const popupHeight = 280;
      const gap = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
      const targetCenterY = rect.top + rect.height / 2;
      const targetCenterX = rect.left + rect.width / 2;
      let placement: "right" | "left" | "center" = "right";

      let left = rect.right + gap;
      if (left + popupWidth > viewportWidth - 16) {
        placement = "left";
        left = rect.left - popupWidth - gap;
      }
      if (left < 16) {
        placement = "center";
        left = Math.min(
          Math.max(16, rect.left + rect.width / 2 - popupWidth / 2),
          viewportWidth - popupWidth - 16,
        );
      }

      const top = clamp(targetCenterY - popupHeight / 2, 16, viewportHeight - popupHeight - 16);

      setDemoPopupPosition({ top, left });

      if (placement === "right") {
        setDemoPopupArrow({
          side: "left",
          offset: clamp(targetCenterY - top, 24, popupHeight - 24),
        });
        return;
      }

      if (placement === "left") {
        setDemoPopupArrow({
          side: "right",
          offset: clamp(targetCenterY - top, 24, popupHeight - 24),
        });
        return;
      }

      setDemoPopupArrow({
        side: "top",
        offset: clamp(targetCenterX - left, 24, popupWidth - 24),
      });
    };

    updateDemoPopupPosition();
    window.addEventListener("resize", updateDemoPopupPosition);
    window.addEventListener("scroll", updateDemoPopupPosition, true);

    return () => {
      window.removeEventListener("resize", updateDemoPopupPosition);
      window.removeEventListener("scroll", updateDemoPopupPosition, true);
    };
  }, [demoOpen, demoStepIndex, demoSteps]);

  const currentDemoStep = demoSteps[demoStepIndex];
  const isFirstDemoStep = demoStepIndex === 0;
  const isLastDemoStep = demoStepIndex === demoSteps.length - 1;

  function getDemoFocusClass(targetId: string): string {
    if (!demoOpen || currentDemoStep?.targetId !== targetId) return "";
    return "relative z-40 ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_hsl(var(--primary)_/_0.25),0_0_32px_-12px_hsl(var(--primary)_/_0.55)] transition-all duration-300";
  }

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

      <Card id="hero-command-center" className={`card-glow hover-lift reveal-up reveal-delay-1 overflow-hidden border-border bg-card ${getDemoFocusClass("hero-command-center")}`}>
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
              <Button
                variant="outline"
                className="rounded-lg border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => startDemo(0)}
              >
                Demo mode
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6 xl:col-span-2">
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
        </div>

        <Card id="total-monthly-section" className={`card-glow hover-lift reveal-up h-full overflow-hidden rounded-xl border-border bg-card ${getDemoFocusClass("total-monthly-section")}`}>
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

        <Card id="billing-timeline-section" className={`card-glow hover-lift reveal-up reveal-delay-3 h-full rounded-xl border-border bg-card ${getDemoFocusClass("billing-timeline-section")}`}>
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

        {hasTrialAlerts && (
          <div id="trial-trap-section" className={`reveal-up reveal-delay-2 h-full [&>*]:h-full rounded-xl ${getDemoFocusClass("trial-trap-section")}`}>
            <TrialTrapDetector subscriptions={subscriptions} />
          </div>
        )}

        <div id="usage-insights" className={`reveal-up reveal-delay-3 h-full [&>*]:h-full rounded-xl ${getDemoFocusClass("usage-insights")}`}>
          <UsageValueMeter subscriptions={subscriptions} />
        </div>

        <div id="sharing-optimizer-section" className={`reveal-up reveal-delay-6 h-full [&>*]:h-full rounded-xl ${getDemoFocusClass("sharing-optimizer-section")}`}>
          <SharingOptimizer />
        </div>

        <Card
          id="subscriptions-section"
          className={`card-glow hover-lift reveal-up reveal-delay-5 rounded-xl border-border bg-card xl:col-span-2 ${getDemoFocusClass("subscriptions-section")}`}
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

        <div id="ai-chat-section" className={`reveal-up reveal-delay-6 xl:col-span-2 min-h-[430px] [&>*]:h-full rounded-xl ${getDemoFocusClass("ai-chat-section")}`}>
          <AppChatbox />
        </div>
      </div>

      <SubscriptionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
        subscriptionId={editingId}
        subscriptions={subscriptions}
      />

      {demoOpen && (
        <>
          <div className="pointer-events-none fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" />

          <div
            className="fixed z-50 w-[min(420px,calc(100vw-2rem))] overflow-visible rounded-2xl border border-border bg-card/95 p-5 shadow-[0_20px_70px_-25px_hsl(var(--primary)_/_0.55)] backdrop-blur"
            style={{ top: demoPopupPosition.top, left: demoPopupPosition.left }}
          >
            <div
              className={`absolute h-4 w-4 rotate-45 border border-border bg-card/95 ${
                demoPopupArrow.side === "left"
                  ? "-left-2 border-r-0 border-t-0"
                  : demoPopupArrow.side === "right"
                    ? "-right-2 border-l-0 border-b-0"
                    : "-top-2 border-r-0 border-b-0"
              }`}
              style={
                demoPopupArrow.side === "top"
                  ? { left: `${demoPopupArrow.offset}px` }
                  : { top: `${demoPopupArrow.offset}px` }
              }
            />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-primary/90">
                Demo mode: Step {demoStepIndex + 1} of {demoSteps.length}
              </p>
              <h3 className="text-lg font-semibold text-foreground">{currentDemoStep?.title}</h3>
              <p className="text-sm text-muted-foreground">{currentDemoStep?.description}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstDemoStep}
                className="rounded-lg"
              >
                Previous step
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDemoOpen(false)}
                  className="rounded-lg"
                >
                  Exit demo
                </Button>

                {isLastDemoStep ? (
                  <Button
                    type="button"
                    className="btn-gradient rounded-lg"
                    onClick={() => setDemoOpen(false)}
                  >
                    Finish demo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="btn-gradient rounded-lg"
                    onClick={goToNextStep}
                  >
                    Next step
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
