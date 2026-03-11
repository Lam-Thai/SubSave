"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Subscription } from "./dashboard-client";

const CATEGORIES = [
  "Streaming",
  "Software",
  "Cloud storage",
  "Music",
  "Gaming",
  "News",
  "Fitness",
  "Other",
];

export function SubscriptionForm({
  open,
  onOpenChange,
  onSaved,
  subscriptionId,
  subscriptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  subscriptionId: string | null;
  subscriptions: Subscription[];
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [monthlyUsageCount, setMonthlyUsageCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = subscriptionId
    ? subscriptions.find((s) => s.id === subscriptionId)
    : null;

  useEffect(() => {
    if (open) {
      setError(null);
      if (editing) {
        setName(editing.name);
        setCategory(editing.category);
        setMonthlyCost(String(editing.monthlyCost));
        setBillingDate(String(editing.billingDate));
        setTrialEndsAt(editing.trialEndsAt ? editing.trialEndsAt.slice(0, 16) : "");
        setMonthlyUsageCount(editing.monthlyUsageCount != null ? String(editing.monthlyUsageCount) : "");
      } else {
        setName("");
        setCategory("");
        setMonthlyCost("");
        setBillingDate("");
        setTrialEndsAt("");
        setMonthlyUsageCount("");
      }
    }
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cost = parseFloat(monthlyCost);
    const date = parseInt(billingDate, 10);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!category) {
      setError("Category is required");
      return;
    }
    if (Number.isNaN(cost) || cost <= 0) {
      setError("Enter a valid monthly cost");
      return;
    }
    if (Number.isNaN(date) || date < 1 || date > 31) {
      setError("Billing date must be between 1 and 31");
      return;
    }
    const usageCount = monthlyUsageCount === "" ? undefined : parseInt(monthlyUsageCount, 10);
    if (monthlyUsageCount !== "" && (Number.isNaN(usageCount) || usageCount < 0)) {
      setError("Usage count must be 0 or more");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        monthlyCost: cost,
        billingDate: date,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        monthlyUsageCount: usageCount ?? null,
      };
      if (editing) {
        const res = await fetch(`/api/subscriptions/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error ? String(err.error) : "Update failed");
          return;
        }
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error ? String(err.error) : "Create failed");
          return;
        }
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit subscription" : "Add subscription"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Monthly cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                placeholder="9.99"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billingDate">Billing date (day of month)</Label>
              <Input
                id="billingDate"
                type="number"
                min="1"
                max="31"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trialEndsAt">Trial ends (optional)</Label>
              <Input
                id="trialEndsAt"
                type="datetime-local"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyUsageCount">Times used this month (optional)</Label>
              <Input
                id="monthlyUsageCount"
                type="number"
                min="0"
                value={monthlyUsageCount}
                onChange={(e) => setMonthlyUsageCount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="btn-gradient rounded-xl">
              {saving ? "Saving…" : editing ? "Save changes" : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
