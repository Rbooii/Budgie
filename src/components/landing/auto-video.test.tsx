import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import {
  stubIntersectionObserver,
  stubMatchMedia,
  type IOController,
} from "@/test-utils/browser-mocks";
import { AutoVideo } from "@/components/landing/auto-video";

describe("AutoVideo", () => {
  let io: IOController;

  beforeEach(() => {
    io = stubIntersectionObserver();
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the poster with the play glyph and no video initially", () => {
    const { container } = render(
      <AutoVideo mp4="/v.mp4" webm="/v.webm" label="demo" />,
    );
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders posterContent above the tint", () => {
    render(
      <AutoVideo
        mp4="/v.mp4"
        label="demo"
        posterContent={<span>caption strip</span>}
      />,
    );
    expect(screen.getByText("caption strip")).toBeInTheDocument();
  });

  it("applies custom poster and frame classes", () => {
    const { container } = render(
      <AutoVideo
        mp4="/v.mp4"
        label="demo"
        posterClassName="bg-red-500"
        frameClassName="frame-custom"
        glyphSize="w-8 h-8"
      />,
    );
    const poster = container.querySelector(".bg-red-500");
    expect(poster).not.toBeNull();
    expect(container.firstElementChild?.className).toContain("frame-custom");
  });

  it("mounts the video with both sources only after intersecting", () => {
    const { container } = render(
      <AutoVideo mp4="/v.mp4" webm="/v.webm" label="demo" />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    const sources = container.querySelectorAll("source");
    expect(sources).toHaveLength(2);
    expect(sources[0].getAttribute("src")).toBe("/v.webm");
    expect(sources[0].getAttribute("type")).toBe("video/webm");
    expect(sources[1].getAttribute("src")).toBe("/v.mp4");
    expect(sources[1].getAttribute("type")).toBe("video/mp4");
  });

  it("does not mount the video when out of view", () => {
    const { container } = render(
      <AutoVideo mp4="/v.mp4" label="demo" />,
    );
    expect(container.querySelector("video")).toBeNull();
  });

  it("mounts a single mp4 source when webm is absent", () => {
    const { container } = render(<AutoVideo mp4="/v.mp4" label="demo" />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const sources = container.querySelectorAll("source");
    expect(sources).toHaveLength(1);
    expect(sources[0].getAttribute("type")).toBe("video/mp4");
  });

  it("mounts a single webm source when mp4 is absent", () => {
    const { container } = render(<AutoVideo webm="/v.webm" label="demo" />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const sources = container.querySelectorAll("source");
    expect(sources).toHaveLength(1);
    expect(sources[0].getAttribute("type")).toBe("video/webm");
  });

  it("never mounts the video when no source is provided", () => {
    const { container } = render(<AutoVideo label="demo" />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    expect(container.querySelector("video")).toBeNull();
  });

  it("never mounts the video under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    const { container } = render(
      <AutoVideo mp4="/v.mp4" webm="/v.webm" label="demo" />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    expect(container.querySelector("video")).toBeNull();
  });

  it("fades the video in and plays it once it can play", async () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <AutoVideo mp4="/v.mp4" label="demo" />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "play", { value: playMock, configurable: true });
    expect(video.className).toContain("opacity-0");
    video.dispatchEvent(new Event("canplay"));
    await waitFor(() => {
      expect(video.className).toContain("opacity-100");
      expect(playMock).toHaveBeenCalledTimes(1);
    });
  });

  it("swallows play() rejections (autoplay policy)", async () => {
    const playMock = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    const { container } = render(<AutoVideo mp4="/v.mp4" label="demo" />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "play", { value: playMock, configurable: true });
    video.dispatchEvent(new Event("canplay"));
    await waitFor(() => expect(video.className).toContain("opacity-100"));
  });

  it("marks the video element with the accessible label and autoplay attributes", () => {
    const { container } = render(<AutoVideo mp4="/v.mp4" label="silent demo" />);
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("aria-label")).toBe("silent demo");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.getAttribute("playsinline")).not.toBeNull();
    expect(video.getAttribute("autoplay")).not.toBeNull();
  });

  it("unmounts the video if reduced-motion kicks in later", () => {
    const mql = stubMatchMedia(false);
    const { container } = render(
      <AutoVideo mp4="/v.mp4" label="demo" />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    act(() => io.trigger(wrap, true));
    expect(container.querySelector("video")).not.toBeNull();
    act(() => mql.change(true));
    expect(container.querySelector("video")).toBeNull();
  });
});
