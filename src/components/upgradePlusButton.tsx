"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "./button";
import { useRouter } from "next/navigation";
import { PlusPaymentWizard } from "./plus-payment-wizard";

export default function UpgradePlusButton({ plus }: { plus: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDowngrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.user.$patch({ json: { plus: false } });
      if (!res.ok) {
        let msg = "Failed to downgrade";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        setError(msg);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to downgrade");
    } finally {
      setLoading(false);
    }
  }

  if (!plus) {
    return (
      <PlusPaymentWizard
        triggerVariant="success"
        triggerSize="lg"
        triggerFullWidth
        triggerLabel="Upgrade to Plus"
      />
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
      <Button
        variant="outline"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleDowngrade}
      >
        Downgrade to Free
      </Button>
    </div>
  );
}
