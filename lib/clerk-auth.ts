import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDbUserId(): Promise<string | null> {
  const { userId } = auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const fallbackEmail = `${userId}@clerk.local`;

  const updateData: Prisma.UserUpdateInput = {
    name: clerkUser?.fullName ?? clerkUser?.firstName ?? null,
    image: clerkUser?.imageUrl ?? null,
  };

  if (primaryEmail) {
    updateData.email = primaryEmail;
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: updateData,
    create: {
      id: userId,
      email: primaryEmail ?? fallbackEmail,
      name: clerkUser?.fullName ?? clerkUser?.firstName ?? null,
      image: clerkUser?.imageUrl ?? null,
    },
  });

  return userId;
}
