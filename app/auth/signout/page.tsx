import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutForm } from "./signout-form";

export default async function SignOutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  return <SignOutForm />;
}
