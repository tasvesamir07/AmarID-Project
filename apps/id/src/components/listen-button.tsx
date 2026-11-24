"use client";

import { Square, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";

/**
 * Reads an instruction aloud, for people who find listening easier than reading.
 *
 * It uses the voice already installed on the phone, so nothing is downloaded and
 * no text leaves the device. Phones without a voice for the current language
 * do not show the button at all, rather than reading Bangla with an English voice.
 */
export function ListenButton({ text, className }: { text: string; className?: string }) {
  const t = useT();
  const locale = useLocale();
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const pick = () => {
      const voices = synth.getVoices();
      setVoice(voices.find((v) => v.lang.toLowerCase().startsWith(locale)) ?? null);
    };
    pick();
    synth.addEventListener("voiceschanged", pick);
    return () => {
      synth.removeEventListener("voiceschanged", pick);
      synth.cancel();
    };
  }, [locale]);

  // Stop reading when the instruction on screen changes.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [text]);

  if (!voice) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice!.lang;
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={`inline-flex h-11 items-center gap-2 rounded-full bg-info-soft px-4 text-[15px] font-medium text-info hover:brightness-95 ${className ?? ""}`}
    >
      {speaking ? <Square className="size-4 fill-current" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      {speaking ? t.common.stopListening : t.common.listen}
    </button>
  );
}
