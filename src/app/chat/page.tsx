import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/page-shell";
import { AccountTab } from "@/components/account-tab";
import { ChatView } from "@/components/chat/chat-view";

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
      <ChatView userId={session.user.id} userName={session.user.name}>
        <AccountTab userName={session.user.name} />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 md:mt-8">
          Chat
        </h1>
      </ChatView>
    </PageShell>
  );
}