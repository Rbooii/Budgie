import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import {
  stubMatchMedia,
  stubRequestAnimationFrame,
} from "@/test-utils/browser-mocks";
import { SmoothScroll } from "@/components/landing/smooth-scroll";

const { MockLenis } = vi.hoisted(() => {
  class MockLenis {
    static instances: MockLenis[] = [];
    scrollTo = vi.fn();
    raf = vi.fn();
    destroy = vi.fn();
    constructor() {
      MockLenis.instances.push(this);
    }
  }
  return { MockLenis };
});

vi.mock("lenis", () => ({
  default: MockLenis,
}));

type MockLenisInstance = InstanceType<typeof MockLenis>;

function lastInstance(): MockLenisInstance {
  return MockLenis.instances[MockLenis.instances.length - 1];
}

function renderWithAnchor(href: string, id: string) {
  return render(
    <div>
      <a href={href}>link</a>
      <div id={id} />
    </div>,
  );
}

function clickAnchor() {
  fireEvent.click(document.querySelector("a") as HTMLAnchorElement);
}

beforeEach(() => {
  MockLenis.instances = [];
  window.history.replaceState(null, "", "/");
  stubMatchMedia(false);
  stubRequestAnimationFrame();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SmoothScroll", () => {
  it("renders nothing", () => {
    const { container } = render(<SmoothScroll />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not create Lenis under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    render(<SmoothScroll />);
    expect(MockLenis.instances).toHaveLength(0);
  });

  it("creates a Lenis instance and drives it with a rAF loop", () => {
    const raf = stubRequestAnimationFrame();
    render(<SmoothScroll />);
    expect(MockLenis.instances).toHaveLength(1);
    act(() => raf.tickAll(0));
    expect(lastInstance().raf).toHaveBeenCalledWith(0);
  });

  it("glides to the section when an in-page hash link is clicked", () => {
    renderWithAnchor("#pricing", "pricing");
    render(<SmoothScroll />);
    clickAnchor();
    const pricing = document.getElementById("pricing");
    expect(lastInstance().scrollTo).toHaveBeenCalledWith(pricing, {
      offset: -88,
    });
  });

  it("handles the /#section form the nav uses", () => {
    renderWithAnchor("/#features", "features");
    render(<SmoothScroll />);
    clickAnchor();
    const features = document.getElementById("features");
    expect(lastInstance().scrollTo).toHaveBeenCalledWith(features, {
      offset: -88,
    });
  });

  it("does not intercept links without a hash (e.g. /sign-in)", () => {
    renderWithAnchor("/sign-in", "sign-in");
    render(<SmoothScroll />);
    clickAnchor();
    expect(lastInstance().scrollTo).not.toHaveBeenCalled();
  });

  it("does not intercept hash links that have no matching section", () => {
    renderWithAnchor("#ghost", "unrelated");
    render(<SmoothScroll />);
    clickAnchor();
    expect(lastInstance().scrollTo).not.toHaveBeenCalled();
  });

  it("settles a deep-link hash from the URL on mount and strips it", () => {
    window.history.pushState(null, "", "/#pricing");
    const raf = stubRequestAnimationFrame();
    renderWithAnchor("#pricing", "pricing");
    const replaceSpy = vi.spyOn(history, "replaceState");
    render(<SmoothScroll />);
    act(() => raf.tickAll(16));
    const pricing = document.getElementById("pricing");
    expect(lastInstance().scrollTo).toHaveBeenCalledWith(pricing, {
      offset: -88,
    });
    expect(replaceSpy).toHaveBeenCalled();
    expect(window.location.hash).toBe("");
  });

  it("does not strip the hash when the target section is missing", () => {
    window.history.pushState(null, "", "/#ghost");
    const raf = stubRequestAnimationFrame();
    render(<SmoothScroll />);
    act(() => raf.tickAll(16));
    expect(lastInstance().scrollTo).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#ghost");
  });

  it("cleans up: destroys Lenis and stops intercepting clicks", () => {
    const raf = stubRequestAnimationFrame();
    renderWithAnchor("#pricing", "pricing");
    const { unmount } = render(<SmoothScroll />);
    const instance = lastInstance();
    unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(raf.cancelSpy).toHaveBeenCalled();
    clickAnchor();
    expect(instance.scrollTo).not.toHaveBeenCalled();
  });
});
