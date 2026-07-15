"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, useState } from "react";
import { formatRupiah } from "@/lib/format";

const STORAGE_KEY = "budgie:hideBalance";

const HIDDEN_DEFAULT = true;

let storeValue = HIDDEN_DEFAULT;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return storeValue;
}

function getServerSnapshot(): boolean {
  return HIDDEN_DEFAULT;
}

if (typeof window !== "undefined") {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    storeValue = stored === null ? HIDDEN_DEFAULT : stored === "true";
  } catch {
    storeValue = HIDDEN_DEFAULT;
  }
}

function setHiddenAndPersist(next: boolean) {
  storeValue = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // ignore
  }
  emit();
}

type BalanceVisibilityContextValue = {
  hidden: boolean;
  toggle: () => void;
  toggleCount: number;
};

const BalanceVisibilityContext = createContext<BalanceVisibilityContextValue>({
  hidden: HIDDEN_DEFAULT,
  toggle: () => {},
  toggleCount: 0,
});

export function BalanceVisibilityProvider({ children }: { children: React.ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [toggleCount, setToggleCount] = useState(0);

  const toggle = useCallback(() => {
    setHiddenAndPersist(!storeValue);
    setToggleCount((c) => c + 1);
  }, []);

  return (
    <BalanceVisibilityContext.Provider value={{ hidden, toggle, toggleCount }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  return useContext(BalanceVisibilityContext);
}

export function MaskedBalance({
  value,
  className,
  mask = "long",
}: {
  value: number;
  className?: string;
  mask?: "long" | "short";
}) {
  const { hidden, toggleCount } = useBalanceVisibility();
  const bullets = mask === "long" ? "Rp\u00A0••••••••" : "Rp\u00A0••••••";
  const text = hidden ? bullets : formatRupiah(value);

  if (toggleCount === 0) {
    return (
      <span className={className} suppressHydrationWarning>
        {text}
      </span>
    );
  }

  const chars = Array.from(text);
  const charsToRender = chars.map((char, i) => (
    <span
      key={i}
      className="inline-block animate-[balanceReveal_0.3s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(i * 28, 260)}ms` }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));

  return (
    <span
      key={toggleCount}
      className={`${className ?? ""} tabular-nums`}
      suppressHydrationWarning
    >
      {charsToRender}
    </span>
  );
}