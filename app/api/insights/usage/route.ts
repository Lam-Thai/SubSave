import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
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
