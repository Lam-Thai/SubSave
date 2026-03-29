import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

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
              {session.user.email ?? session.user.name}
            </span>
            <Button variant="outline" size="sm" className="rounded-lg border-border" asChild>
              <Link href="/auth/signout">Sign out</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
