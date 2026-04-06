import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getRequestId, jsonWithRequestId } from "@/lib/http";
import { attachRateLimitHeaders, checkRateLimit } from "@/lib/rate-limit";
import { getDbUserId } from "@/lib/clerk-auth";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  monthlyCost: z.number().positive("Cost must be positive"),
  billingDate: z.number().int().min(1).max(31),
  trialEndsAt: z.string().datetime().optional().nullable(),
  monthlyUsageCount: z.number().int().min(0).optional().nullable(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const userId = await getDbUserId();
  if (!userId) {
    return jsonWithRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
  }
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  type Sub = (typeof subscriptions)[number];
  const totalMonthly = subscriptions.reduce(
    (sum: number, s: Sub) => sum + Number(s.monthlyCost),
    0
  );
  return jsonWithRequestId(
    {
      subscriptions: subscriptions.map((s: Sub) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        monthlyCost: Number(s.monthlyCost),
        billingDate: s.billingDate,
        trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
        monthlyUsageCount: s.monthlyUsageCount ?? 0,
        createdAt: s.createdAt.toISOString(),
      })),
      totalMonthly,
    },
    requestId,
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = getRequestId(request);
  const userId = await getDbUserId();
  if (!userId) {
    return jsonWithRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: `subscription-write:${userId}`,
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    const response = jsonWithRequestId(
      {
        error: "Too many create requests. Please wait a moment.",
        code: "RATE_LIMITED",
      },
      requestId,
      { status: 429 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const response = jsonWithRequestId({ error: "Invalid JSON" }, requestId, { status: 400 });
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const response = jsonWithRequestId(
      { error: parsed.error.flatten().fieldErrors },
      requestId,
      { status: 400 },
    );
    attachRateLimitHeaders(response, rateLimit);
    return response;
  }
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      name: parsed.data.name,
      category: parsed.data.category,
      monthlyCost: parsed.data.monthlyCost,
      billingDate: parsed.data.billingDate,
      trialEndsAt: parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : undefined,
      monthlyUsageCount: parsed.data.monthlyUsageCount ?? undefined,
    },
  });
  const response = jsonWithRequestId(
    {
      id: subscription.id,
      name: subscription.name,
      category: subscription.category,
      monthlyCost: Number(subscription.monthlyCost),
      billingDate: subscription.billingDate,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      monthlyUsageCount: subscription.monthlyUsageCount ?? 0,
      createdAt: subscription.createdAt.toISOString(),
    },
    requestId,
  );
  attachRateLimitHeaders(response, rateLimit);
  return response;
}
