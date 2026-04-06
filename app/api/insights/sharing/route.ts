import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserId } from "@/lib/clerk-auth";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function GET(): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [userSubs, circles] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
    }),
    prisma.circle.findMany({
      where: { userId },
      include: {
        members: { include: { subscriptions: true } },
      },
    }),
  ]);
  const suggestions: Array<{
    subscriptionName: string;
    yourCost: number;
    memberName: string;
    memberCost: number;
    potentialSavings: string;
    message: string;
  }> = [];
  const userSubNames = new Map(userSubs.map((s) => [normalizeName(s.name), s]));
  for (const circle of circles) {
    for (const member of circle.members) {
      for (const sub of member.subscriptions) {
        const key = normalizeName(sub.name);
        const yourSub = userSubNames.get(key);
        if (yourSub) {
          const yourCost = Number(yourSub.monthlyCost);
          const theirCost = Number(sub.monthlyCost);
          const combined = yourCost + theirCost;
          const familyEstimate = Math.max(yourCost, theirCost) * 1.5;
          const savings = combined - familyEstimate;
          if (savings > 0) {
            suggestions.push({
              subscriptionName: sub.name,
              yourCost,
              memberName: member.name,
              memberCost: theirCost,
              potentialSavings: `~$${savings.toFixed(2)}/mo`,
              message: `You and ${member.name} both pay for ${sub.name}. A family plan could save around $${savings.toFixed(2)}/month.`,
            });
          } else {
            suggestions.push({
              subscriptionName: sub.name,
              yourCost,
              memberName: member.name,
              memberCost: theirCost,
              potentialSavings: "Shared plan",
              message: `You and ${member.name} both have ${sub.name}. Consider a shared or family plan to reduce total cost.`,
            });
          }
        }
      }
    }
  }
  return NextResponse.json({ suggestions });
}
