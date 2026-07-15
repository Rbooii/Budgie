import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="w-full min-h-screen flex flex-col md:flex-row bg-white text-black">
      <Sidebar />
      <div className="flex-1 min-h-screen py-6 md:py-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-20 md:pb-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-black/40 mt-2">Coming soon</p>
      </div>
    </main>
  );
}