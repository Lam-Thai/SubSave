import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDbUserId } from "@/lib/clerk-auth";

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: circleId, memberId } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, userId },
  });
  if (!circle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const count = await prisma.circleMember.updateMany({
    where: { id: memberId, circleId },
    data: parsed.data,
  });
  if (count.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: circleId, memberId } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, userId },
  });
  if (!circle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const count = await prisma.circleMember.deleteMany({
    where: { id: memberId, circleId },
  });
  if (count.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
