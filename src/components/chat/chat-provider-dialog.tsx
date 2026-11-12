"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";

type PublicConfig = {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  label: string | null;
  hasKey: boolean;
};

function fieldClass() {
  return "mt-1.5 w-full rounded-[14px] border border-hairline bg-card px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/30 focus:border-ink/20 focus:ring-4 focus:ring-ink/[0.04]";
}

async function errorFrom(res: Response): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Something went wrong";
}

export function ChatProviderDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after save/disconnect so the view can refresh its config. */
  onChanged: () => void;
}) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    Promise.resolve().then(async () => {
      if (cancelled) return;
      setError(null);
      setNotice(null);
      setApiKey("");

      try {
        const res = await api["chat-provider"].$get();
        if (!res.ok) throw new Error("Could not load model settings");
        const data = (await res.json()) as PublicConfig;
        if (cancelled) return;
        setConfig(data);
        setBaseUrl(data.baseUrl ?? "");
        setModel(data.model ?? "");
        setLabel(data.label ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load settings",
          );
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const payload = () => ({
    baseUrl: baseUrl.trim(),
    model: model.trim(),
    label: label.trim() || undefined,
    apiKey: apiKey.trim() || undefined,
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api["chat-provider"].$put({ json: payload() });
      if (!res.ok) throw new Error(await errorFrom(res));
      setNotice("Saved.");
      onChanged();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (testing) return;
    setTesting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api["chat-provider"].test.$post({ json: payload() });
      if (!res.ok) throw new Error(await errorFrom(res));
      setNotice("Connection works.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect your model? Budgie will use the built-in models again.")) {
      return;
    }
    setError(null);
    try {
      const res = await api["chat-provider"].$delete();
      if (!res.ok) throw new Error(await errorFrom(res));
      setConfig({
        configured: false,
        baseUrl: null,
        model: null,
        label: null,
        hasKey: false,
      });
      setBaseUrl("");
      setModel("");
      setLabel("");
      setApiKey("");
      setNotice("Disconnected.");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="pr-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Your model</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/45">
          Connect an OpenAI-compatible endpoint. The key is stored encrypted and
          only used by Budgie&apos;s server.
        </p>
      </div>

      <form onSubmit={save} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-ink/50">Endpoint</span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            autoComplete="off"
            spellCheck={false}
            required
            className={fieldClass()}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/50">API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              config?.hasKey ? "Saved. Leave blank to keep it" : "sk-..."
            }
            autoComplete="new-password"
            spellCheck={false}
            className={fieldClass()}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/50">Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            autoComplete="off"
            spellCheck={false}
            required
            className={fieldClass()}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/50">Label (optional)</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My model"
            autoComplete="off"
            className={fieldClass()}
          />
        </label>

        <p className="text-[11px] leading-relaxed text-ink/35">
          The model must support tool calling to read your accounts. Budgie
          sends your financial snapshot and tool results from its server to this
          endpoint, never from your browser.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[14px] bg-expense-tint px-3 py-2.5 text-expense"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-[13px] font-medium">{error}</p>
          </div>
        )}
        {notice && (
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-income">
            <Check className="h-3.5 w-3.5" />
            {notice}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" variant="success" size="md" loading={saving}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            loading={testing}
            onClick={test}
          >
            Test
          </Button>
          {config?.configured && (
            <button
              type="button"
              onClick={disconnect}
              className="ml-auto text-xs font-medium text-expense/80 transition hover:text-expense active:scale-95"
            >
              Disconnect
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
