import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold text-foreground">
            SubSave
          </Link>
          <nav className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground max-w-[180px] truncate sm:max-w-none">
              {session.user.email ?? session.user.name}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/signout">Sign out</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
