import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignOutPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Are you sure you want to sign out?</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <SignOutButton redirectUrl="/">
            <Button>Sign out</Button>
          </SignOutButton>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
