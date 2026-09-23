import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/page-skeleton";
import { ChatView } from "@/components/chat/chat-view";

export default function ChatPage() {
  return (
    <PageShell flush>
      <Suspense fallback={<PageSkeleton variant="chat" />}>
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
    <ChatView userId={session.user.id} userName={session.user.name ?? undefined} />
  );
}
