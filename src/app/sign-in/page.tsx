import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInForm />}>
      <SignInGate />
    </Suspense>
  );
}

async function SignInGate() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
