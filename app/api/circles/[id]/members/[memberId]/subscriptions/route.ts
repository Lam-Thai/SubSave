import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDbUserId } from "@/lib/clerk-auth";

const addSchema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyCost: z.number().positive("Cost must be positive"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: circleId, memberId } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, userId },
    include: { members: true },
  });
  if (!circle || !circle.members.some((m) => m.id === memberId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const sub = await prisma.circleMemberSubscription.create({
    data: {
      memberId,
      name: parsed.data.name,
      monthlyCost: parsed.data.monthlyCost,
    },
  });
  return NextResponse.json({
    id: sub.id,
    name: sub.name,
    monthlyCost: Number(sub.monthlyCost),
  });
}
