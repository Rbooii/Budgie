import { Button } from "@/components/button";
import { SignOutButton } from "../dashboard/sign-out-button";
import { ArrowLeft, BadgeDollarSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { AccountTab, getInitials } from "@/components/account-tab";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";

export default async function Profile() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <PageShell>
            <div className="w-full h-fit flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Account &amp; Subscription
                </h1>
                <div className="flex gap-2 items-center">
                    <Link href="/dashboard">
                        <Button variant="outline" leadingIcon={<ArrowLeft className="w-4 h-4" />} size="md">
                            Back
                        </Button>
                    </Link>
                    <SignOutButton />
                </div>
            </div>

            {/* Identity card */}
            <div className="mt-8 w-full rounded-[35px] bg-black p-8 sm:p-10 flex flex-col items-center text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.25)]">
                <div className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] font-bold bg-[#F2F2F2] rounded-full flex items-center justify-center text-4xl sm:text-5xl text-black">
                    {getInitials(session.user.name || "")}
                </div>

                <h2 className="text-white text-xl sm:text-2xl font-semibold mt-5">
                    {session.user.name}
                </h2>
                <p className="text-white/50 text-sm mt-1">{session.user.email}</p>

                <div className="mt-6 w-full max-w-xs h-px bg-white/10" />

                <div className="mt-6 flex flex-col items-center gap-1">
                    <p className="text-white/40 text-xs">Membership Number</p>
                    <p className="text-white text-sm font-medium tabular-nums tracking-tight">
                        {session.user.id}
                    </p>
                </div>
            </div>

            {/* Upgrade card */}
            <div className="mt-4 w-full rounded-[35px] bg-[#00C610] p-8 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-4">
                <div className="flex-1">
                    <div className="w-fit h-fit rounded-full bg-white/15 flex items-center justify-center mb-4">
                        <BadgeDollarSign className="w-20 h-20 rotate-12 text-amber-300" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                        Get Budgie Plus
                    </h3>
                    <p className="text-white text-sm mt-1 flex items-center gap-1.5">
                        50% off your first month
                    </p>
                </div>

                <div className="sm:text-right">
                    <p className="text-white text-xs">Starting from</p>
                    <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight">
                        Rp XX.XXX
                    </p>
                    <p className="text-white text-xs mt-1">per month</p>
                    <Button
                        variant="soft"
                        size="md"
                        className="mt-4 w-full sm:w-auto"
                    >
                        Upgrade Now
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}