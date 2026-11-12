"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import { ChatProviderDialog } from "@/components/chat/chat-provider-dialog";

type PublicConfig = {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  label: string | null;
  hasKey: boolean;
};

function hostOf(baseUrl: string | null): string | null {
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).host;
  } catch {
    return null;
  }
}

export function ChatProviderSettings() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api["chat-provider"].$get();
      if (!res.ok) return;
      setConfig((await res.json()) as PublicConfig);
    } catch {
      // The settings row stays in its "not loaded" state.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const host = hostOf(config?.baseUrl ?? null);
  const detail = config?.configured
    ? `${config.label?.trim() || config.model || "Custom model"}${host ? `, ${host}` : ""}`
    : "Using Budgie's built-in models";

  return (
    <div className="rounded-[20px] bg-surface px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">AI assistant</p>
        <p className="mt-0.5 truncate text-xs text-ink/40">{detail}</p>
      </div>
      <Button
        variant="outline"
        size="md"
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        Manage
      </Button>

      <ChatProviderDialog
        open={open}
        onOpenChange={setOpen}
        onChanged={() => void load()}
      />
    </div>
  );
}
