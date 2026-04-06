import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDbUserId } from "@/lib/clerk-auth";

const updateSchema = z.object({ name: z.string().min(1).optional() });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id, userId },
    include: {
      members: { include: { subscriptions: true } },
    },
  });
  if (!circle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: circle.id,
    name: circle.name,
    members: circle.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subscriptions: m.subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        monthlyCost: Number(s.monthlyCost),
      })),
    })),
    createdAt: circle.createdAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const count = await prisma.circle.updateMany({
    where: { id, userId },
    data: parsed.data,
  });
  if (count.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.circle.findUniqueOrThrow({
    where: { id },
    include: { members: { include: { subscriptions: true } } },
  });
  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    members: updated.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subscriptions: m.subscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        monthlyCost: Number(s.monthlyCost),
      })),
    })),
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const userId = await getDbUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const count = await prisma.circle.deleteMany({
    where: { id, userId },
  });
  if (count.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
