import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TRIAL_ALERT_DAYS = 14;

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + TRIAL_ALERT_DAYS);
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
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
