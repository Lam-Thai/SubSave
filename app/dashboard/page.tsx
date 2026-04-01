import { getServerSession } from "next-auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const subscriptions = session?.user?.id
    ? await prisma.subscription.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalMonthly = subscriptions.reduce(
    (sum, sub) => sum + Number(sub.monthlyCost),
    0,
  );

  return (
    <DashboardClient
      initialData={{
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          name: sub.name,
          category: sub.category,
          monthlyCost: Number(sub.monthlyCost),
          billingDate: sub.billingDate,
          trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
          monthlyUsageCount: sub.monthlyUsageCount ?? 0,
          createdAt: sub.createdAt.toISOString(),
        })),
        totalMonthly,
      }}
    />
  );
}
