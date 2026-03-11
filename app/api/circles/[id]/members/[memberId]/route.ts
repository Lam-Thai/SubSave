import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: circleId, memberId } = await params;
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, userId: session.user.id },
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
