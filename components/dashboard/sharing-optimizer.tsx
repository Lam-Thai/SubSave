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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";

interface CircleMember {
  id: string;
  name: string;
  email?: string;
  subscriptions: Array<{ id: string; name: string; monthlyCost: number }>;
}

interface Circle {
  id: string;
  name: string;
  members: CircleMember[];
}

interface Suggestion {
  subscriptionName: string;
  yourCost: number;
  memberName: string;
  memberCost: number;
  potentialSavings: string;
  message: string;
}

export function SharingOptimizer() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleFormOpen, setCircleFormOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [memberFormOpen, setMemberFormOpen] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberSubName, setMemberSubName] = useState("");
  const [memberSubCost, setMemberSubCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [editCircle, setEditCircle] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editMember, setEditMember] = useState<{
    circleId: string;
    id: string;
    name: string;
  } | null>(null);

  function fetchData() {
    Promise.all([
      fetch("/api/circles").then((r) => (r.ok ? r.json() : { circles: [] })),
      fetch("/api/insights/sharing").then((r) =>
        r.ok ? r.json() : { suggestions: [] },
      ),
    ])
      .then(([circleData, sharingData]) => {
        setCircles(circleData.circles ?? []);
        setSuggestions(sharingData.suggestions ?? []);
      })
      .catch(() => {
        setCircles([]);
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function createCircle(e: React.FormEvent) {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCircleName.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setNewCircleName("");
      setCircleFormOpen(false);
      fetchData();
    }
  }

  async function addMember(e: React.FormEvent, circleId: string) {
    e.preventDefault();
    if (!memberName.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/circles/${circleId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: memberName.trim(), email: "" }),
    });
    setSaving(false);
    if (res.ok) {
      setMemberName("");
      setMemberFormOpen(null);
      fetchData();
    }
  }

  async function deleteCircle(circleId: string) {
    if (!confirm("Delete this circle and all its members?")) return;
    const res = await fetch(`/api/circles/${circleId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  async function updateCircle(e: React.FormEvent) {
    e.preventDefault();
    if (!editCircle || !editCircle.name.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/circles/${editCircle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCircle.name.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setEditCircle(null);
      fetchData();
    }
  }

  async function deleteMember(circleId: string, memberId: string) {
    if (!confirm("Delete this member?")) return;
    const res = await fetch(`/api/circles/${circleId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  }

  async function updateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editMember || !editMember.name.trim()) return;
    setSaving(true);
    const res = await fetch(
      `/api/circles/${editMember.circleId}/members/${editMember.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editMember.name.trim() }),
      },
    );
    setSaving(false);
    if (res.ok) {
      setEditMember(null);
      fetchData();
    }
  }

  async function addMemberSubscription(circleId: string, memberId: string) {
    if (!memberSubName.trim() || !memberSubCost.trim()) return;
    const cost = parseFloat(memberSubCost);
    if (Number.isNaN(cost) || cost <= 0) return;
    setSaving(true);
    const res = await fetch(
      `/api/circles/${circleId}/members/${memberId}/subscriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: memberSubName.trim(), monthlyCost: cost }),
      },
    );
    setSaving(false);
    if (res.ok) {
      setMemberSubName("");
      setMemberSubCost("");
      fetchData();
    }
  }

  if (loading) {
    return (
      <Card className="card-glow rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Sharing optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-glow rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Sharing optimizer
          </CardTitle>
          <CardDescription>
            Add a trusted circle (e.g. family) and their subscriptions to find
            duplicate subs and shared plan savings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setCircleFormOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New circle
            </Button>
          </div>
          {circles.length > 0 && (
            <ul className="space-y-3">
              {circles.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          setEditCircle({ id: c.id, name: c.name })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteCircle(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-2 text-sm">
                    {c.members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between pl-2 text-muted-foreground"
                      >
                        <span>
                          {m.name}
                          {m.subscriptions.length > 0 && (
                            <span className="ml-1">
                              —{" "}
                              {m.subscriptions
                                .map((s) => `${s.name} ($${s.monthlyCost})`)
                                .join(", ")}
                            </span>
                          )}
                          <button
                            type="button"
                            className="ml-2 text-primary hover:underline"
                            onClick={() => {
                              setMemberFormOpen(`${c.id}:${m.id}`);
                              setMemberSubName("");
                              setMemberSubCost("");
                            }}
                          >
                            + Add subscription
                          </button>
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              setEditMember({
                                circleId: c.id,
                                id: m.id,
                                name: m.name,
                              })
                            }
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteMember(c.id, m.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setMemberFormOpen(c.id);
                      setMemberName("");
                    }}
                  >
                    + Add member
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {suggestions.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 font-medium text-foreground">
                Savings insights
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {suggestions.map((s, i) => (
                  <li key={i}>{s.message}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={circleFormOpen} onOpenChange={setCircleFormOpen}>
        <DialogContent>
          <form onSubmit={createCircle}>
            <DialogHeader>
              <DialogTitle>New circle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="circleName">Name (e.g. Family)</Label>
              <Input
                id="circleName"
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                placeholder="Family"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCircleFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !newCircleName.trim()}
                className="btn-gradient rounded-xl"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!memberFormOpen}
        onOpenChange={(open) => !open && setMemberFormOpen(null)}
      >
        <DialogContent>
          {memberFormOpen?.includes(":") ? (
            (() => {
              const [circleId, memberId] = memberFormOpen.split(":");
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Add subscription for member</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2 py-4">
                    <Label htmlFor="msName">Subscription name</Label>
                    <Input
                      id="msName"
                      value={memberSubName}
                      onChange={(e) => setMemberSubName(e.target.value)}
                      placeholder="Netflix"
                    />
                    <Label htmlFor="msCost">Monthly cost ($)</Label>
                    <Input
                      id="msCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={memberSubCost}
                      onChange={(e) => setMemberSubCost(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setMemberFormOpen(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="btn-gradient rounded-xl"
                      disabled={
                        saving || !memberSubName.trim() || !memberSubCost.trim()
                      }
                      onClick={() =>
                        circleId &&
                        memberId &&
                        addMemberSubscription(circleId, memberId)
                      }
                    >
                      Add
                    </Button>
                  </DialogFooter>
                </>
              );
            })()
          ) : (
            <form
              onSubmit={(e) => memberFormOpen && addMember(e, memberFormOpen)}
            >
              <DialogHeader>
                <DialogTitle>Add circle member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                <Label htmlFor="memberName">Name</Label>
                <Input
                  id="memberName"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Mom"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMemberFormOpen(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !memberName.trim()}
                  className="btn-gradient rounded-xl"
                >
                  Add
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editCircle}
        onOpenChange={(open) => !open && setEditCircle(null)}
      >
        <DialogContent>
          <form onSubmit={updateCircle}>
            <DialogHeader>
              <DialogTitle>Edit circle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="editCircleName">Name</Label>
              <Input
                id="editCircleName"
                value={editCircle?.name ?? ""}
                onChange={(e) =>
                  editCircle &&
                  setEditCircle({ ...editCircle, name: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCircle(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !editCircle?.name.trim()}
                className="btn-gradient rounded-xl"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      >
        <DialogContent>
          <form onSubmit={updateMember}>
            <DialogHeader>
              <DialogTitle>Edit member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label htmlFor="editMemberName">Name</Label>
              <Input
                id="editMemberName"
                value={editMember?.name ?? ""}
                onChange={(e) =>
                  editMember &&
                  setEditMember({ ...editMember, name: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditMember(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !editMember?.name.trim()}
                className="btn-gradient rounded-xl"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
