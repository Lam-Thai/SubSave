"use client";

import { useEffect, useState } from "react";
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
import { UsageValueMeter } from "@/components/dashboard/usage-value-meter";
import { TrialTrapDetector } from "@/components/dashboard/trial-trap-detector";
import { SharingOptimizer } from "@/components/dashboard/sharing-optimizer";
import { AppChatbox } from "@/components/dashboard/app-chatbox";
import { Plus } from "lucide-react";

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

export function DashboardClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchSubscriptions() {
    try {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData({ subscriptions: [], totalMonthly: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  function handleSaved() {
    setFormOpen(false);
    setEditingId(null);
    fetchSubscriptions();
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="sr-only">Loading subscriptions…</span>
      </div>
    );
  }

  const totalMonthly = data?.totalMonthly ?? 0;
  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscriptions and monthly spending
          </p>
        </div>
      </div>

      <Card className="card-glow overflow-hidden rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Total monthly cost</CardTitle>
          <CardDescription>
            Sum of all subscription costs this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold gradient-text">
            {formatCurrency(totalMonthly)}
          </p>
        </CardContent>
      </Card>

      <TrialTrapDetector />

      <UsageValueMeter />

      <AppChatbox />

      <Card className="card-glow rounded-xl border-border bg-card">
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

      <SharingOptimizer />

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
