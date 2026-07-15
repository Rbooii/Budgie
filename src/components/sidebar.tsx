"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightLeft, House, MessageCircle, PiggyBank } from "lucide-react";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

const sidebarData: SidebarItem[] = [
  {
    icon: <House className="h-5 w-5" />,
    label: "Home",
    href: "/dashboard",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Chat",
    href: "/chat",
  },
  {
    icon: <ArrowRightLeft className="h-5 w-5" />,
    label: "Transactions",
    href: "/transactions",
  },
  {
    icon: <PiggyBank className="h-5 w-5" />,
    label: "Budget",
    href: "/budget",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] h-fit p-10 text-black shrink-0 md:sticky md:top-0 self-start">
        <h1 className="font-bold text-2xl text-center">Budgie</h1>
        <nav className="mt-5 flex flex-col gap-1">
          {sidebarData.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex gap-[15px] px-[22px] py-[10px] rounded-[35px] items-center transition active:scale-[0.98] ${
                  isActive
                    ? "bg-[#F2F2F2]"
                    : "hover:bg-[#F2F2F2]"
                }`}
              >
                {item.icon}
                <p className="text-sm">{item.label}</p>
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-[#F2F2F2] pt-6">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/5 flex">
        {sidebarData.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition active:scale-95 ${
                isActive ? "text-[#00C610]" : "text-black/50"
              }`}
            >
              {item.icon}
              <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}