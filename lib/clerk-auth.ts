import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDbUserId(): Promise<string | null> {
  const { userId } = await auth();
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

  try {
    const existingById = await prisma.user.findUnique({ where: { id: userId } });
    if (existingById) {
      await prisma.user.update({ where: { id: userId }, data: updateData });
      return existingById.id;
    }

    // Support users migrated from another auth provider where row id != Clerk userId.
    if (primaryEmail) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: primaryEmail } });
      if (existingByEmail) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            ...updateData,
            email: primaryEmail,
          },
        });
        return existingByEmail.id;
      }
    }

    const created = await prisma.user.create({
      data: {
        id: userId,
        email: primaryEmail ?? fallbackEmail,
        name: clerkUser?.fullName ?? clerkUser?.firstName ?? null,
        image: clerkUser?.imageUrl ?? null,
      },
    });

    return created.id;
  } catch (error) {
    // Keep auth flow alive even if DB sync races across concurrent requests.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && primaryEmail) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: primaryEmail } });
      if (existingByEmail) {
        return existingByEmail.id;
      }
    }

    throw error;
  }
}
