"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, getBillingDateLabel } from "@/lib/utils";
import type { Subscription } from "./dashboard-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function SubscriptionList({
  subscriptions,
  onEdit,
  onDeleted,
}: {
  subscriptions: Subscription[];
  onEdit: (id: string) => void;
  onDeleted: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete(id: string) {
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeletingId(null);
      onDeleted();
    }
  }

  if (subscriptions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No subscriptions yet. Click &quot;Add subscription&quot; to add one.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {subscriptions.map((sub) => (
          <li
            key={sub.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{sub.name}</p>
              <p className="text-sm text-muted-foreground">
                {sub.category} · Bills on the {getBillingDateLabel(sub.billingDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-right font-medium">
                {formatCurrency(sub.monthlyCost)}<span className="text-muted-foreground">/mo</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(sub.id)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeletingId(sub.id)}
                aria-label={`Delete ${sub.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subscription</DialogTitle>
            <DialogDescription>
              This cannot be undone. The subscription will be removed from your list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && confirmDelete(deletingId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
