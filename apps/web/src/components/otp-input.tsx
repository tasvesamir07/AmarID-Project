"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const [codes, setCodes] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<HTMLInputElement[]>([]);
  const isComplete = codes.every((c) => c !== "");

  useEffect(() => {
    if (value !== undefined) {
      setCodes(Array(length).fill("").map((_, i) => value[i] || ""));
    }
  }, [value, length]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const next = [];
      for (let i = 0; i < length; i++) {
        next.push(i === index ? e.target.value.replace(/\D/g, "").slice(0, 1) : codes[i]);
      }
      setCodes(next);
      const joined = next.join("");
      onChange?.(joined);
      if (joined.length === length) onComplete?.(joined);

      // auto-advance
      if (e.target.value && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [codes, length, onChange, onComplete]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        (e.target as HTMLInputElement).value = "";
        const next = [...codes]; next[index] = "";
        setCodes(next);
        onChange?.(next.join(""));
        if (index > 0) inputs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
      if (e.key === "ArrowRight" && index < length - 1) inputs.current[index + 1]?.focus();
    },
    [codes, length, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const paste = (e as unknown as { clipboardData: DataTransfer }).clipboardData!.getData("text").replace(/\D/g, "").slice(0, length);
      const next = codes.map((_, i) => paste[i] || "");
      setCodes(next);
      onChange?.(next.join(""));
      if (next.join("").length === length) onComplete?.(next.join(""));
    },
    [codes, length, onChange, onComplete]
  );

  return (
    <div className="flex items-center gap-2">
      {codes.map((code, index) => (
        <input
          key={index}
          ref={(el: HTMLInputElement | null) => {
            if (el) inputs.current[index] = el;
          }}
          type="text"
          maxLength={1}
          value={code}
          onChange={(e) => handleInput(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            "w-10 h-12 text-center rounded-lg border border-input bg-background text-lg font-mono font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed sm:w-12 sm:h-14 sm:text-xl",
            code && "bg-primary/10 border-primary"
          )}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

export function Countdown({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining, seconds, onExpire]);
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  return <span className="text-sm font-mono text-muted-foreground">{m}:{s}</span>;
}
