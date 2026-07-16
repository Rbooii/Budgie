import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <PageShell>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-black/40 mt-2">Coming soon</p>
      </div>
    </PageShell>
  );
}
