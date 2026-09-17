import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { AccountTab } from "@/components/account-tab";
import { ChatView } from "@/components/chat/chat-view";

export default function ChatPage() {
  return (
    <PageShell>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <ChatContent />
      </Suspense>
    </PageShell>
  );
}

async function ChatContent() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <>
      <AccountTab userName={session.user.name} userId={session.user.id} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
        Chat
      </h1>

      <ChatView userId={session.user.id} userName={session.user.name} />
    </>
  );
}
