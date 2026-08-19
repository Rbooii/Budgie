"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SiGooglegemini } from "react-icons/si";
import type { ChatStatus } from "ai";
import { MODEL_CHAIN, modelLabel, type ChatModelId } from "@/lib/chat-models";
import { cn } from "@/lib/cn";

const SPRING_TRANSITION =
  "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
const SMOOTH_HEIGHT_TRANSITION =
  "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.15s ease-out";

type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  status: ChatStatus;
  stop: () => void;
  model: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
};

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: Array<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

function MorphingText({ text }: { text: string }) {
  const [width, setWidth] = useState<number | "auto">("auto");
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      setWidth(spanRef.current.offsetWidth);
    }
  }, [text]);

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden transition-all duration-300",
        "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
      )}
      style={{ width }}
    >
      <span ref={spanRef} className="invisible whitespace-nowrap px-1">
        {text}
      </span>
      <span
        key={text}
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap animate-[fadeZoomIn_300ms_ease-out]"
      >
        {text}
      </span>
    </span>
  );
}

function GeminiIcon({ lite, className }: { lite: boolean; className?: string }) {
  return (
    <SiGooglegemini
      className={cn(
        "transition-opacity",
        lite ? "text-[#1F9B29]" : "text-black/40 opacity-70",
        className,
      )}
    />
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.75 6.5V7a4.25 4.25 0 0 0 8.5 0v-.5M7 11.25V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function ChatInput({
  input,
  setInput,
  onSend,
  status,
  stop,
  model,
  onModelChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isSmoothResize, setIsSmoothResize] = useState(false);
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  const [hoverStyle, setHoverStyle] = useState({
    opacity: 0,
    transform: "translateY(0px) scale(0.95)",
    transition: "none",
  });
  const [textareaHeight, setTextareaHeight] = useState(68);
  const [isScrolling, setIsScrolling] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(5).fill(0));

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topFadeRef = useRef<HTMLDivElement>(null);
  const bottomFadeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(input);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const demoIntervalRef = useRef<number | null>(null);
  const demoTextIntervalRef = useRef<number | null>(null);

  const busy = status === "submitted" || status === "streaming";
  const canSend = status === "ready";
  const isLite = model !== MODEL_CHAIN[0];
  const hasValue = input.trim() !== "";
  const models = MODEL_CHAIN.map((m) => modelLabel(m));
  const containerHeight = Math.max(116, textareaHeight + 48);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const updateFades = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (topFadeRef.current) {
      topFadeRef.current.style.opacity = Math.min(scrollTop / 20, 1).toString();
    }
    if (bottomFadeRef.current) {
      const bottomScroll = scrollHeight - clientHeight - scrollTop;
      bottomFadeRef.current.style.opacity = Math.min(
        Math.max(bottomScroll - 16, 0) / 10,
        1,
      ).toString();
    }
  }, []);

  const handleValueChange = useCallback(
    (val: string) => {
      if (val.trim() !== "" && !expanded) {
        setIsSmoothResize(false);
        setExpanded(true);
      } else {
        setIsSmoothResize(true);
      }
      setInput(val);
    },
    [setInput, expanded],
  );

  const expand = useCallback(() => {
    setIsSmoothResize(false);
    setExpanded(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    if (demoTextIntervalRef.current) {
      window.clearInterval(demoTextIntervalRef.current);
      demoTextIntervalRef.current = null;
    }
    setIsRecording(false);
    setAudioData(new Array(5).fill(0));
  }, []);

  const startRecording = useCallback(async () => {
    setIsSmoothResize(false);
    setExpanded(true);

    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch {
      console.warn("Microphone access denied or unavailable. Falling back to simulated voice mode for demo.");
    }

    setIsRecording(true);

    function simulateText() {
      const fakeText = "How much did I spend on Food & Drink this month?";
      const words = fakeText.split(" ");
      let i = 0;
      let currentBase = inputRef.current;
      demoTextIntervalRef.current = window.setInterval(() => {
        if (i < words.length) {
          currentBase = (currentBase ? currentBase + " " : "") + words[i];
          handleValueChange(currentBase);
          i++;
        } else {
          stopRecording();
        }
      }, 300);
    }

    if (stream) {
      streamRef.current = stream;

      const AudioCtx: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVisualizer = () => {
        analyser.getByteFrequencyData(dataArray);
        const bands = new Array(5).fill(0);
        const step = Math.floor(dataArray.length / 5);
        for (let i = 0; i < 5; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j];
          }
          bands[i] = sum / step / 255;
        }
        setAudioData(bands);
        rafRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      const SpeechRecognition =
        (
          window as unknown as {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
          }
        ).SpeechRecognition ??
        (
          window as unknown as {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
          }
        ).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        let baseline = inputRef.current;

        recognition.onresult = (event: SpeechRecognitionResultEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            baseline += (baseline ? " " : "") + finalTranscript;
          }
          handleValueChange(
            (baseline + (interimTranscript ? " " + interimTranscript : "")).trim(),
          );
        };

        recognition.onerror = (e: unknown) => {
          console.error("Speech recognition error", e);
          stopRecording();
        };

        recognition.onend = () => {
          stopRecording();
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        console.warn("Speech Recognition API not supported in this browser. Using simulated text.");
        simulateText();
      }
    } else {
      demoIntervalRef.current = window.setInterval(() => {
        setAudioData(Array.from({ length: 5 }, () => Math.random() * 0.8 + 0.1));
      }, 100);
      simulateText();
    }
  }, [handleValueChange, stopRecording]);

  useEffect(() => {
    if (isRecording && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [input, isRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  useEffect(() => {
    if (expanded && !isRecording) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expanded, isRecording]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;

    const currentHeight = el.style.height;
    el.style.transition = "none";
    el.style.height = "0px";
    const scrollHeight = el.scrollHeight;
    el.style.height = currentHeight;
    void el.offsetHeight;
    el.style.transition = "";

    const newHeight = Math.max(68, Math.min(scrollHeight, 160));
    el.style.height = `${newHeight}px`;

    setTextareaHeight(newHeight);
    setIsScrolling(scrollHeight > 160);

    setTimeout(updateFades, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, expanded]);

  useEffect(() => {
    const t = setTimeout(updateFades, 0);
    return () => clearTimeout(t);
  }, [textareaHeight, updateFades]);

  useEffect(() => {
    if (!isModelSelectOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsModelSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isModelSelectOpen]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) return;
    if (input.trim() === "" && !isRecording) {
      setIsSmoothResize(false);
      setExpanded(false);
      setIsModelSelectOpen(false);
    }
  };

  const submit = () => {
    if (input.trim() === "" || !canSend) return;
    setIsSmoothResize(false);
    onSend(input);
    setInput("");
    setExpanded(false);
    setIsModelSelectOpen(false);
  };

  const onActionButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (busy) {
      stop();
    } else if (hasValue) {
      submit();
    } else if (canSend) {
      startRecording();
    }
  };

  const showArrow = hasValue && !isRecording && !busy;
  const showStop = isRecording || busy;
  const showMic = !hasValue && !isRecording && !busy && canSend;

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      className="relative mx-auto flex w-full flex-col"
      style={{
        maxWidth: expanded ? 480 : 320,
        transition: isSmoothResize
          ? "max-width 0.15s ease-out"
          : "max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
    >
      <div
        onMouseDown={(e) => {
          const isTextarea = e.target === textareaRef.current;
          if (expanded && !isTextarea && !isRecording) {
            e.preventDefault();
            textareaRef.current?.focus();
          }
        }}
        style={{
          borderRadius: 20,
          height: expanded ? containerHeight : 48,
          transition: isSmoothResize ? SMOOTH_HEIGHT_TRANSITION : SPRING_TRANSITION,
          overflow: expanded ? "visible" : "hidden",
        }}
        className={cn(
          "relative w-full border border-black/10 bg-white shadow-sm focus-within:border-[#00C610]/40 focus-within:ring-1 focus-within:ring-[#00C610]/20 hover:border-black/20 z-10",
          expanded ? "cursor-text" : "cursor-default",
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleValueChange(e.target.value)}
          onScroll={updateFades}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape" && input.trim() === "") {
              setIsSmoothResize(false);
              setExpanded(false);
              setIsModelSelectOpen(false);
            }
          }}
          placeholder="Write a message…"
          aria-label="Prompt"
          disabled={status === "error" || isRecording}
          style={{
            transition: isSmoothResize
              ? "height 0.15s ease-out"
              : "opacity 0.3s ease-out, transform 0.3s ease-out, height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          className={cn(
            "absolute top-0 inset-x-0 z-[1] w-full resize-none bg-transparent pl-4 pr-12 py-3.5 text-sm leading-[22px] text-black outline-none placeholder:font-medium placeholder:text-black/40 cursor-text",
            expanded
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
            isScrolling ? "overflow-y-auto" : "overflow-y-hidden",
            isRecording && "pointer-events-none",
            status === "error" && "opacity-60",
          )}
        />

        <div
          ref={topFadeRef}
          className="absolute left-4 right-12 top-0 z-[2] h-8 bg-gradient-to-b from-white via-white/90 to-transparent pointer-events-none"
        />
        <div
          ref={bottomFadeRef}
          className="absolute left-4 right-12 z-[2] h-8 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"
          style={{
            opacity: 0,
            top: `${textareaHeight - 32}px`,
            transition: isSmoothResize ? "top 0.15s ease-out" : "top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        />

        <button
          type="button"
          onClick={expand}
          style={{
            transition: isSmoothResize
              ? "none"
              : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          className={cn(
            "absolute inset-x-0 top-0 z-[1] cursor-text pl-4 pr-12 py-[15px] text-left text-sm font-medium leading-[17px] text-black/45 outline-none",
            !expanded
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-105 translate-y-1 pointer-events-none",
          )}
          aria-label="Open prompt input"
        >
          {input.trim() !== "" ? input : "Write a message…"}
        </button>

        <div
          className={cn(
            "absolute bottom-2 left-3 right-12 z-[10] flex items-center gap-0 transition-all duration-300",
            "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
            expanded && !isRecording
              ? "opacity-100 blur-0 translate-y-0 pointer-events-auto"
              : "opacity-0 blur-sm translate-y-2 pointer-events-none",
          )}
        >
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsModelSelectOpen((prev) => !prev);
              }}
              className={cn(
                "group flex items-center gap-1.5 rounded-full px-2 py-1 text-black/50 transition-all duration-200 outline-none hover:bg-[#F2F2F2]/60 hover:text-black cursor-default",
                isModelSelectOpen ? "bg-[#F2F2F2]/60 text-black" : "",
              )}
              aria-label={`Select model. Current: ${modelLabel(model)}`}
            >
              <GeminiIcon lite={isLite} className="size-3.5 group-hover:opacity-100" />
              <span className="text-xs font-semibold select-none transition-colors">
                <MorphingText text={modelLabel(model)} />
              </span>
            </button>

            <div
              style={{ transformOrigin: "bottom left" }}
              onMouseLeave={() => {
                setHoverStyle((prev) => ({
                  ...prev,
                  opacity: 0,
                  transform: prev.transform.replace("scale(1)", "scale(0.95)"),
                  transition: "opacity 0.2s ease-in, transform 0.2s ease-out",
                }));
              }}
              className={cn(
                "absolute bottom-full left-0 mb-2.5 z-50 w-44 rounded-2xl border border-black/10 bg-white/95 p-1 shadow-xl backdrop-blur-md flex flex-col gap-0.5 transition-all duration-400 cursor-default",
                isModelSelectOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  : "opacity-0 scale-95 translate-y-3 pointer-events-none ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
              )}
            >
              <div className="relative flex flex-col gap-0.5">
                <div
                  style={hoverStyle}
                  className="absolute left-0 right-0 top-0 h-8 -z-10 rounded-xl bg-[#F2F2F2] pointer-events-none"
                />
                {models.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => {
                      setHoverStyle((prev) => ({
                        opacity: 1,
                        transform: `translateY(${idx * 34}px) scale(1)`,
                        transition:
                          prev.opacity === 0
                            ? "opacity 0.15s ease-out"
                            : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease",
                      }));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onModelChange(MODEL_CHAIN[idx]);
                      setIsModelSelectOpen(false);
                    }}
                    className="group relative flex h-8 w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-black/80 outline-none active:scale-[0.98] cursor-default"
                  >
                    <span className="flex items-center gap-2">
                      <GeminiIcon
                        lite={MODEL_CHAIN[idx] !== MODEL_CHAIN[0]}
                        className="size-3.5 group-hover:opacity-100"
                      />
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "absolute right-12 bottom-2 z-[10] flex h-8 items-center justify-end gap-[3px] transition-all duration-400",
            "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
            isRecording ? "w-16 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-4 pointer-events-none",
          )}
        >
          {audioData.map((val, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-[#00C610] transition-[height] duration-75 ease-out"
              style={{ height: `${Math.max(4, val * 24)}px` }}
            />
          ))}
        </div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={onActionButtonClick}
          aria-label={
            showArrow
              ? "Send message"
              : showStop
                ? isRecording
                  ? "Stop recording"
                  : "Stop generating"
                : "Use voice input"
          }
          style={{ borderRadius: 9999 }}
          className="absolute right-2 bottom-2 z-[10] flex h-8 w-8 items-center justify-center bg-[#00C610] text-white transition-all duration-300 hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-[#00C610]/40 cursor-default disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={status === "error"}
        >
          <span className="relative flex h-full w-full items-center justify-center">
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                showArrow
                  ? "opacity-100 scale-100 rotate-0 blur-none"
                  : "opacity-0 scale-50 rotate-45 blur-[1px] pointer-events-none",
              )}
            >
              <ArrowUpIcon />
            </span>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                showMic
                  ? "opacity-100 scale-100 rotate-0 blur-none"
                  : "opacity-0 scale-50 -rotate-45 blur-[1px] pointer-events-none",
              )}
            >
              <MicIcon />
            </span>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300",
                "ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
                showStop
                  ? "opacity-100 scale-100 rotate-0 blur-none"
                  : "opacity-0 scale-50 rotate-45 blur-[1px] pointer-events-none",
              )}
            >
              <StopIcon />
            </span>
          </span>
        </button>
      </div>
      <p className="text-center text-[11px] text-black/35 mt-2">
        Budgie can make mistakes. Double-check the important numbers.
      </p>
    </div>
  );
}