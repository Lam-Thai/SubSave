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
import { Plus } from "lucide-react";

export interface Subscription {
  id: string;
  name: string;
  category: string;
  monthlyCost: number;
  billingDate: number;
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
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading subscriptions…</p>
      </div>
    );
  }

  const totalMonthly = data?.totalMonthly ?? 0;
  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and monthly spending
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add subscription
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total monthly cost</CardTitle>
          <CardDescription>Sum of all subscription costs this month</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(totalMonthly)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>
            {subscriptions.length === 0
              ? "Add your first subscription to get started"
              : `${subscriptions.length} subscription${subscriptions.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleEdit}
            onDeleted={fetchSubscriptions}
          />
        </CardContent>
      </Card>

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
