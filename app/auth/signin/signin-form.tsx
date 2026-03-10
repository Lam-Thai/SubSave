"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const hasGoogle = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
  const isDev = process.env.NODE_ENV === "development";

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email: email || "dev@subsave.local", callbackUrl });
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sign in to SubSave</CardTitle>
          <CardDescription>
            Use your email or Google to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error === "OAuthAccountNotLinked"
                ? "This email is already linked to another sign-in method."
                : "Sign-in failed. Please try again."}
            </div>
          )}

          {isDev && !hasGoogle && (
            <form onSubmit={handleCredentials} className="space-y-2">
              <Label htmlFor="email">Email (dev)</Label>
              <Input
                id="email"
                type="email"
                placeholder="dev@subsave.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in with Email"}
              </Button>
            </form>
          )}

          {hasGoogle && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl })}
            >
              Continue with Google
            </Button>
          )}

          {!hasGoogle && !isDev && (
            <p className="text-center text-sm text-muted-foreground">
              Configure Google or Email provider in environment variables.
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline hover:text-foreground">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
