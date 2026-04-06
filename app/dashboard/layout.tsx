import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await currentUser();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/logo.svg" alt="SubSave" width={32} height={32} className="logo-pulse rounded-lg" />
            <span className="gradient-text gradient-text-flow">SubSave</span>
          </Link>
          <nav className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground max-w-[180px] truncate sm:max-w-none">
              {user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? "User"}
            </span>
            <Button variant="outline" size="sm" className="rounded-lg border-border" asChild>
              <Link href="/dashboard?demo=1">Demo</Link>
            </Button>
            <SignOutButton>
              <Button variant="outline" size="sm" className="rounded-lg border-border">
                Sign out
              </Button>
            </SignOutButton>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
