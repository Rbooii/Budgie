"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api-client";
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Variant, Size } from "@/components/button";

type Step = 1 | 2 | 3;

interface CheckoutResult {
  orderId: string;
  qrString: string;
  status: "pending";
  expiresAt: string;
}

interface PlusPaymentWizardProps {
  triggerVariant?: Variant;
  triggerSize?: Size;
  triggerFullWidth?: boolean;
  triggerLabel?: string;
}

const POLL_INTERVAL_MS = 3000;
const FIRST_MONTH = 24500;
const REGULAR = 49000;

export function PlusPaymentWizard({
  triggerVariant = "soft",
  triggerSize = "md",
  triggerFullWidth = false,
  triggerLabel = "Upgrade Now",
}: PlusPaymentWizardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setStep(1);
    setCheckout(null);
    setLoading(false);
    setSimulating(false);
    setError(null);
    orderIdRef.current = null;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const handleOpenChange = useCallback(
    (o: boolean) => {
      setOpen(o);
      if (!o) reset();
    },
    [reset],
  );

  const pollStatus = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        const res = await api.plus.status[":orderId"].$get({
          param: { orderId },
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.transactionStatus === "settlement") {
          setStep(3);
          return true;
        }
        if (
          data.transactionStatus === "expire" ||
          data.transactionStatus === "cancel"
        ) {
          setError("Payment expired or cancelled. Please try again.");
          return true;
        }
      } catch {}
      return false;
    },
    [],
  );

  const startPolling = useCallback(
    (orderId: string) => {
      const tick = async () => {
        const done = await pollStatus(orderId);
        if (!done && orderIdRef.current === orderId) {
          pollingRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      };
      pollingRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [pollStatus],
  );

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  async function openCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.plus.checkout.$post({});
      if (!res.ok) {
        let msg = "Failed to start checkout";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      const data: CheckoutResult = await res.json();
      setCheckout(data);
      orderIdRef.current = data.orderId;
      setStep(2);
      startPolling(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulatePayment() {
    if (!checkout) return;
    setSimulating(true);
    setError(null);
    try {
      const res = await api.plus["simulate-payment"][":orderId"].$post({
        param: { orderId: checkout.orderId },
      });
      if (!res.ok) {
        let msg = "Payment simulation failed";
        try {
          const body = JSON.parse(await res.text());
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.transactionStatus === "settlement") {
        if (pollingRef.current) clearTimeout(pollingRef.current);
        setStep(3);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSimulating(false);
    }
  }

  function handleDone() {
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        fullWidth={triggerFullWidth}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <div className="flex flex-col text-left">
          {step !== 3 && (
            <>
              <div className="flex items-center justify-between pr-8">
                <h2 className="text-2xl font-medium">Get Budgie Plus</h2>
                <span className="text-xs font-medium text-black/40">
                  {step} of 3
                </span>
              </div>
              <div className="h-0.5 w-full bg-black/[0.06] mt-4 mb-5">
                <div
                  className="h-full bg-[#00C610] transition-all duration-300 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </>
          )}

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-[20px] px-4 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          {step === 1 && (
            <div
              key="step-1"
              className="flex flex-col gap-4 animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums tracking-tight text-[#1F9B29]">
                  {formatRupiah(FIRST_MONTH)}
                </span>
                <span className="text-sm text-black/30 line-through tabular-nums">
                  {formatRupiah(REGULAR)}
                </span>
                <span className="text-sm text-black/40">/month</span>
              </div>
              <p className="text-xs text-black/40 -mt-2">
                Then {formatRupiah(REGULAR)} per month. Cancel anytime.
              </p>

              <div className="rounded-[20px] bg-[#FAFAFA] divide-y divide-black/[0.04]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-black/40">First month</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/30 line-through tabular-nums">
                      {formatRupiah(REGULAR)}
                    </span>
                    <span className="text-sm font-semibold text-[#1F9B29] tabular-nums">
                      {formatRupiah(FIRST_MONTH)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-black/40">Then</span>
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

              <Button
                type="button"
                variant="success"
                size="lg"
                fullWidth
                loading={loading}
                onClick={openCheckout}
              >
                Continue to pay
              </Button>
            </div>
          )}

          {step === 2 && checkout && (
            <div
              key="step-2"
              className="flex flex-col items-center gap-4 animate-[stepReveal_0.2s_ease-out] motion-reduce:animate-none"
            >
              <div className="w-full flex items-center justify-center pt-2 pb-1">
                <div className="w-[200px] h-[200px] bg-white rounded-[20px] border border-black/10 p-3 flex items-center justify-center">
                  <QRCodeSVG
                    value={checkout.qrString}
                    size={176}
                    level="M"
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold">
                  Scan with your e-wallet
                </p>
                <p className="text-xs text-black/40 mt-1">
                  Open GoPay, OVO, DANA, or ShopeePay and scan the QR code
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-black/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for payment…
              </div>

              <div className="w-full flex flex-col gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  loading={simulating}
                  onClick={handleSimulatePayment}
                >
                  I&apos;ve paid
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div
              key="step-3"
              className="flex flex-col text-center py-4 gap-3 animate-[stepReveal_0.25s_ease-out] motion-reduce:animate-none"
            >
              <h2 className="text-2xl font-medium">Welcome to Budgie Plus</h2>
              <p className="text-sm text-black/40">
                Your Plus membership is now active.
              </p>
              <Button
                type="button"
                variant="success"
                size="lg"
                fullWidth
                className="mt-3"
                onClick={handleDone}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
