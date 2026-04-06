import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserId } from "@/lib/clerk-auth";

const TRIAL_ALERT_DAYS = 14;

export async function GET(): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + TRIAL_ALERT_DAYS);
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      trialEndsAt: { not: null, gte: now, lte: future },
    },
    orderBy: { trialEndsAt: "asc" },
  });
  const alerts = subscriptions.map((s) => {
    const trialEnd = s.trialEndsAt!;
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: s.id,
      name: s.name,
      monthlyCost: Number(s.monthlyCost),
      trialEndsAt: trialEnd.toISOString(),
      daysLeft,
      message: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — avoid a $${Number(s.monthlyCost).toFixed(2)} charge.`,
    };
  });
  return NextResponse.json({ alerts });
}
