import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDbUserId } from "@/lib/clerk-auth";

const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: circleId } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, userId },
  });
  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const member = await prisma.circleMember.create({
    data: {
      circleId,
      name: parsed.data.name,
      email: parsed.data.email || undefined,
    },
  });
  return NextResponse.json({
    id: member.id,
    name: member.name,
    email: member.email,
    subscriptions: [],
  });
}
