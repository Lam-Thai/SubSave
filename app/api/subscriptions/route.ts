import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  monthlyCost: z.number().positive("Cost must be positive"),
  billingDate: z.number().int().min(1).max(31),
});

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  type Sub = (typeof subscriptions)[number];
  const totalMonthly = subscriptions.reduce(
    (sum: number, s: Sub) => sum + Number(s.monthlyCost),
    0
  );
  return NextResponse.json({
    subscriptions: subscriptions.map((s: Sub) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      monthlyCost: Number(s.monthlyCost),
      billingDate: s.billingDate,
      createdAt: s.createdAt.toISOString(),
    })),
    totalMonthly,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      monthlyCost: parsed.data.monthlyCost,
      billingDate: parsed.data.billingDate,
    },
  });
  return NextResponse.json({
    id: subscription.id,
    name: subscription.name,
    category: subscription.category,
    monthlyCost: Number(subscription.monthlyCost),
    billingDate: subscription.billingDate,
    createdAt: subscription.createdAt.toISOString(),
  });
}
