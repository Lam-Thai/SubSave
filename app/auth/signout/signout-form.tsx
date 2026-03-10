"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignOutForm() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Are you sure you want to sign out?</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
