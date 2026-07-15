"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
      variant="softred"
      size="md"
      leadingIcon={<LogOut className="h-5 w-5" />}
    >
      Sign out
    </Button>
  );
}