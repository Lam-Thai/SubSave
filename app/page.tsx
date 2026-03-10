import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl font-bold text-foreground">Welcome to SubSave</h1>
        <p className="text-muted-foreground">
          Signed in as {session.user.email ?? session.user.name}
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          SubSave
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Track and manage your subscription spending in one place.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">Get started</Link>
        </Button>
      </div>
    </div>
  );
}
