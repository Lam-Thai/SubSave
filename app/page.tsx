import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-green-glow-sm backdrop-blur-sm">
          <Image src="/logo.svg" alt="SubSave" width={48} height={48} className="mx-auto mb-4 rounded-xl" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Signed in as {session.user.email ?? session.user.name}
          </p>
          <Button asChild className="mt-6 btn-gradient rounded-xl" size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 px-4 py-16">
      <Image src="/logo.svg" alt="SubSave" width={80} height={80} className="rounded-2xl" priority />
      <div className="text-center space-y-4 max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="gradient-text">SubSave</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Track and manage your subscription spending in one place. See where your money goes.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="btn-gradient rounded-xl px-8 text-base font-semibold">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-xl border-primary/40 bg-primary/5 px-8 text-base font-semibold text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Link href="/auth/signin">Get started</Link>
        </Button>
      </div>
    </div>
  );
}
