import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication error</CardTitle>
          <CardDescription>
            Something went wrong during sign-in. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/auth/signin">Try again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
