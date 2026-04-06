import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDbUserId } from "@/lib/clerk-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  monthlyCost: z.number().positive().optional(),
  billingDate: z.number().int().min(1).max(31).optional(),
  trialEndsAt: z.string().datetime().optional().nullable(),
  monthlyUsageCount: z.number().int().min(0).optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const subscription = await prisma.subscription.findFirst({
    where: { id, userId },
  });
  if (!subscription) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: subscription.id,
    name: subscription.name,
    category: subscription.category,
    monthlyCost: Number(subscription.monthlyCost),
    billingDate: subscription.billingDate,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    monthlyUsageCount: subscription.monthlyUsageCount ?? 0,
    createdAt: subscription.createdAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.trialEndsAt !== undefined) {
    data.trialEndsAt = parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : null;
  }
  const subscription = await prisma.subscription.updateMany({
    where: { id, userId },
    data,
  });
  if (subscription.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.subscription.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    category: updated.category,
    monthlyCost: Number(updated.monthlyCost),
    billingDate: updated.billingDate,
    trialEndsAt: updated.trialEndsAt?.toISOString() ?? null,
    monthlyUsageCount: updated.monthlyUsageCount ?? 0,
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const result = await prisma.subscription.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
