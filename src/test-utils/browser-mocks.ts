import { vi } from "vitest";

export interface MockIOInstance {
  callback: IntersectionObserverCallback;
  observed: Element[];
  unobserve: (el: Element) => void;
  disconnect: () => void;
}

export interface IOController {
  instances: MockIOInstance[];
  trigger: (target: Element, isIntersecting: boolean) => void;
}

export function stubIntersectionObserver(): IOController {
  const instances: MockIOInstance[] = [];

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    observed: Element[];

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      this.observed = [];
      instances.push(this);
    }

    observe(el: Element) {
      this.observed.push(el);
    }

    unobserve(el: Element) {
      this.observed = this.observed.filter((e) => e !== el);
    }

    disconnect() {
      this.observed = [];
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    get instances() {
      return instances;
    },
    trigger(target: Element, isIntersecting: boolean) {
      for (const inst of instances) {
        inst.callback(
          [{ target, isIntersecting } as IntersectionObserverEntry],
          inst as unknown as IntersectionObserver,
        );
      }
    },
  };
}

export interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  change: (matches: boolean) => void;
}

export function stubMatchMedia(matches: boolean): MockMediaQueryList {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_type: string, cb: () => void) => {
      listeners.add(cb);
    }),
    removeEventListener: vi.fn((_type: string, cb: () => void) => {
      listeners.delete(cb);
    }),
    change(newMatches: boolean) {
      mql.matches = newMatches;
      for (const cb of listeners) cb();
    },
  } as MockMediaQueryList & { listeners: Set<() => void> };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn(() => mql),
  });

  return mql;
}

export function stubRequestAnimationFrame() {
  const callbacks: FrameRequestCallback[] = [];
  const cancelSpy = vi.fn();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    callbacks.push(cb);
    return callbacks.length;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelSpy);
  return {
    callbacks,
    cancelSpy,
    tickAll: (timestamp: number) => {
      for (const cb of callbacks.splice(0)) cb(timestamp);
    },
  };
}

export function setWindowScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value,
  });
}

export function setViewport(innerHeight: number, scrollHeight: number) {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: innerHeight,
  });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    writable: true,
    value: scrollHeight,
  });
}
