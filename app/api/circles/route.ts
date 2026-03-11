import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1, "Name is required") });

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const circles = await prisma.circle.findMany({
    where: { userId: session.user.id },
    include: {
      members: {
        include: { subscriptions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    circles: circles.map((c) => ({
      id: c.id,
      name: c.name,
      members: c.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subscriptions: m.subscriptions.map((s) => ({
          id: s.id,
          name: s.name,
          monthlyCost: Number(s.monthlyCost),
        })),
      })),
      createdAt: c.createdAt.toISOString(),
    })),
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
  const circle = await prisma.circle.create({
    data: { userId: session.user.id, name: parsed.data.name },
  });
  return NextResponse.json({
    id: circle.id,
    name: circle.name,
    members: [],
    createdAt: circle.createdAt.toISOString(),
  });
}
