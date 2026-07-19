import { ArrowRight } from "lucide-react";
import { Button } from "@/components/button";
import Link from "next/link";

interface AccountTabProps {
  userName: string;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountTab({ userName }: AccountTabProps) {
  return (
    <div className="w-full h-fit flex flex-wrap gap-2 sm:gap-3 justify-end items-center">
      <Link href="/profile">
        <Button variant="success" size="md">Get Budgie Plus</Button>
      </Link>
      <Link href="/profile">
        <div className="flex items-center gap-[13px] w-fit h-fit cursor-pointer hover:bg-[#F2F2F2] transition transform duration-150 active:scale-[0.98] rounded-full pr-4 pl-1 py-1">
          <div className="w-[40px] h-[40px] font-bold bg-[#F2F2F2] rounded-full flex items-center justify-center text-sm">
            {getInitials(userName)}
          </div>
          <p className="text-sm font-medium hidden sm:block">{userName}</p>
          <ArrowRight className="w-4 h-4 text-black/50" />
        </div>
      </Link>
    </div>
  );
}