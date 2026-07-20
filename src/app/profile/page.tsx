import { Button } from "@/components/button";
import { SignOutButton } from "../dashboard/sign-out-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/components/account-tab";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { api } from "@/lib/api-client";
import UpgradePlusButton from "@/components/upgradePlusButton";
import { formatRupiah } from "@/lib/format";

const FIRST_MONTH = 24500;
const REGULAR = 49000;

export default async function Profile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await api.user.$get(
    {},
    { headers: Object.fromEntries(await headers()) },
  );

  if (res.status === 401) redirect("/sign-in");

  let plus = false;
  if (res.ok) {
    const data = await res.json();
    plus = data.plus === true;
  }

  return (
    <PageShell>
      <div
        className="w-full h-fit flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[profileReveal_0.2s_ease-out] motion-reduce:animate-none"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Account
        </h1>
        <div className="flex gap-2 items-center">
          <Link href="/dashboard">
            <Button
              variant="outline"
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
              size="md"
            >
              Back
            </Button>
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Identity card */}
      <div
        className="mt-6 w-full rounded-[35px] bg-black p-8 sm:p-10 flex flex-col items-center text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.25)] animate-[profileReveal_0.2s_ease-out] motion-reduce:animate-none"
        style={{ animationDelay: "60ms" }}
      >
        <div className="w-[80px] h-[80px] font-bold bg-[#F2F2F2] rounded-full flex items-center justify-center text-3xl text-black">
          {getInitials(session.user.name || "")}
        </div>

        <h2 className="text-white text-xl font-semibold mt-4">
          {session.user.name}
        </h2>
        <p className="text-white/50 text-sm mt-0.5">{session.user.email}</p>

        <div className="mt-4">
          <span
            className={`inline-block rounded-[24px] px-3 py-0.5 text-xs font-semibold tabular-nums ${
              plus
                ? "bg-[#A0FFA8] text-[#1F9B29]"
                : "bg-white/10 text-white/60"
            }`}
          >
            {plus ? "Plus" : "Free"}
          </span>
        </div>

        <div className="mt-6 w-full max-w-xs h-px bg-white/10" />

        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="text-white/40 text-xs">Membership ID</p>
          <p className="text-white text-sm font-medium tabular-nums tracking-tight">
            {session.user.id}
          </p>
        </div>
      </div>

      {plus ? (
        /* Plus member card — clean white surface */
        <div
          className="mt-3 w-full rounded-[35px] border border-black/10 bg-white p-8 sm:p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] animate-[profileReveal_0.2s_ease-out] motion-reduce:animate-none"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                Budgie Plus
              </h3>
              <p className="text-sm text-black/40 mt-0.5">
                Thank you for supporting Budgie.
              </p>
            </div>
            <span className="inline-block rounded-[24px] px-3 py-0.5 text-xs font-semibold bg-[#A0FFA8] text-[#1F9B29]">
              Active
            </span>
          </div>

          <div className="mt-6 rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-black/40">Plan</span>
              <span className="text-sm font-medium tabular-nums">
                {formatRupiah(REGULAR)}
                <span className="text-xs text-black/40"> /month</span>
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-black/40">Payment method</span>
              <span className="text-sm font-medium">QRIS</span>
            </div>
          </div>

          <div className="mt-6">
            <UpgradePlusButton plus={plus} />
          </div>
        </div>
      ) : (
        /* Upgrade card — clean white surface, real pricing, single success CTA */
        <div
          className="mt-3 w-full rounded-[35px] border border-black/10 bg-white p-8 sm:p-10 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] animate-[profileReveal_0.2s_ease-out] motion-reduce:animate-none"
          style={{ animationDelay: "120ms" }}
        >
          <h3 className="text-xl font-semibold tracking-tight">Budgie Plus</h3>
          <p className="text-sm text-black/40 mt-0.5">
            50% off your first month
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-[#1F9B29]">
              {formatRupiah(FIRST_MONTH)}
            </span>
            <span className="text-sm text-black/30 line-through tabular-nums">
              {formatRupiah(REGULAR)}
            </span>
            <span className="text-sm text-black/40">/month</span>
          </div>
          <p className="text-xs text-black/40 mt-1.5">
            Then {formatRupiah(REGULAR)} per month. Cancel anytime.
          </p>

          <div className="mt-6 rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-black/40">Payment method</span>
              <span className="text-sm font-medium">QRIS</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-black/40">Billing cycle</span>
              <span className="text-sm font-medium">Monthly</span>
            </div>
          </div>

          <div className="mt-6">
            <UpgradePlusButton plus={plus} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
