import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserId } from "@/lib/clerk-auth";

export async function GET(): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
  const insights = subscriptions.map((s) => {
    const cost = Number(s.monthlyCost);
    const uses = s.monthlyUsageCount ?? 0;
    const costPerUse = uses > 0 ? cost / uses : null;
    return {
      id: s.id,
      name: s.name,
      category: s.category,
      monthlyCost: cost,
      monthlyUsageCount: uses,
      costPerUse: costPerUse != null ? Math.round(costPerUse * 100) / 100 : null,
    };
  });
  return NextResponse.json({ insights });
}
