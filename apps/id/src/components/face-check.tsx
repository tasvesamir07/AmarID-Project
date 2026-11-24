"use client";

import { clsx } from "clsx";
import { ArrowLeft, ArrowRight, Check, Eye, ScanFace, ShieldCheck, Smile } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, call } from "@/lib/api-client";
import { advanceStep, framing, measureFace, newStepProgress, type Framing, type Point, type StepProgress } from "@/lib/face-metrics";
import { useErrorText, useT } from "@/lib/i18n/client";
import type { LivenessChallenge, LivenessEvidence, StepKind } from "@/lib/liveness";
import { Button, Notice, Spinner } from "./ui";

/**
 * Live face check.
 *
 * The camera stream is analysed on this device; frames are never uploaded or
 * stored. What leaves the device is a numeric face template plus the evidence
 * that the server's random challenge was performed.
 */

type Detector = {
  load(): Promise<void>;
  detect(input: HTMLVideoElement): Promise<{ face: { mesh: Point[]; embedding?: number[]; real?: number; live?: number }[] }>;
};

type Engine = new (config: Record<string, unknown>) => Detector;

/**
 * The face engine is a static ES module in /vendor (see scripts/copy-models.mjs),
 * loaded on demand with a module script tag.
 */
function loadEngine(): Promise<Engine> {
  const w = window as unknown as { __amaridHuman?: Engine };
  if (w.__amaridHuman) return Promise.resolve(w.__amaridHuman);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/vendor/human-loader.js";
    script.onerror = () => reject(new Error("face engine failed to load"));
    window.addEventListener("amarid-human-ready", () => (w.__amaridHuman ? resolve(w.__amaridHuman) : reject(new Error("face engine missing"))), { once: true });
    document.head.appendChild(script);
  });
}

let detectorPromise: Promise<Detector> | null = null;

function loadDetector(): Promise<Detector> {
  detectorPromise ??= (async () => {
    const Human = await loadEngine();
    const human = new Human({
      modelBasePath: "/models/",
      debug: false,
      warmup: "none", // the built-in warm-up fetches a data: URL, which our CSP rightly blocks
      cacheSensitivity: 0, // analyse every frame; never reuse a previous result
      filter: { enabled: true, equalization: false, flip: false },
      face: {
        enabled: true,
        detector: { rotation: false, maxDetected: 1, minConfidence: 0.5, return: false },
        mesh: { enabled: true },
        iris: { enabled: true },
        description: { enabled: true },
        antispoof: { enabled: true },
        liveness: { enabled: true },
        emotion: { enabled: false },
        attention: { enabled: false },
        gear: { enabled: false },
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false },
      segmentation: { enabled: false },
    });
    await human.load();
    return human;
  })();
  detectorPromise.catch(() => (detectorPromise = null));
  return detectorPromise;
}

type Phase = "intro" | "starting" | "framing" | "step" | "settle" | "sending" | "passed" | "failed";

const STEP_TIMEOUT_MS = 20_000;
const FRAMING_FRAMES = 5;

const stepIcon: Record<StepKind, typeof Eye> = { TURN_LEFT: ArrowLeft, TURN_RIGHT: ArrowRight, OPEN_MOUTH: Smile, BLINK: Eye };

export function FaceCheck({ endpoint, onPassed, onRejected }: {
  /** POST issues a challenge, PUT submits the evidence. */
  endpoint: string;
  onPassed: (result: Record<string, unknown>) => void;
  /** Called for a final refusal from the server (not for a failed attempt that can be retried). */
  onRejected?: (code: string) => boolean;
}) {
  const t = useT();
  const errorText = useErrorText();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("intro");
  const [steps, setSteps] = useState<StepKind[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [hint, setHint] = useState<Framing | "NO_FACE">("NO_FACE");
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    runRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const fail = useCallback((code: string) => {
    stopCamera();
    setError(code);
    setPhase("failed");
  }, [stopCamera]);

  const start = useCallback(async () => {
    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    setError(null);
    setPhase("starting");
    setStepIndex(0);
    setHint("NO_FACE");

    let detector: Detector;
    let challenge: LivenessChallenge;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new ApiError("CAMERA_MISSING", 0);
      const stream = await navigator.mediaDevices
        .getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } })
        .catch((e: DOMException) => {
          throw new ApiError(e.name === "NotAllowedError" ? "CAMERA_DENIED" : "CAMERA_MISSING", 0);
        });
      if (!alive()) return stream.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      detector = await loadDetector().catch(() => {
        throw new ApiError("FACE_MODEL_FAILED", 0);
      });
      challenge = await call<LivenessChallenge>("POST", endpoint);
    } catch (e) {
      if (alive()) fail(e instanceof ApiError ? e.code : "UNKNOWN");
      return;
    }
    if (!alive()) return;
    setSteps(challenge.steps);
    setPhase("framing");

    const video = videoRef.current!;
    const samples: number[][] = [];
    const done: LivenessEvidence["steps"] = [];
    const spoof: number[] = [];
    const live: number[] = [];
    const eyeReadings: number[] = [];
    let eyeBaseline = 0;
    let goodFrames = 0;
    let frames = 0;
    let current = 0;
    let mode: "framing" | "step" | "settle" = "framing";
    let progress: StepProgress = newStepProgress();
    let startedAt = 0;
    let stepStartedAt = 0;

    while (alive()) {
      const result = await detector.detect(video).catch(() => null);
      if (!alive()) return;
      const face = result?.face[0];
      const m = face ? measureFace(face.mesh, video.videoWidth, video.videoHeight) : null;

      if (mode !== "framing" && performance.now() - stepStartedAt > STEP_TIMEOUT_MS) return fail("LIVENESS_TIMEOUT");
      if (!face || !m) {
        setHint("NO_FACE");
        goodFrames = 0;
        await nextFrame();
        continue;
      }
      if (startedAt) frames += 1;

      const placed = framing(m);
      if (mode === "framing" || mode === "settle") {
        setHint(placed);
        goodFrames = placed === "OK" ? goodFrames + 1 : 0;
        if (placed === "OK") {
          eyeReadings.push(m.eye);
          if (typeof face.real === "number") spoof.push(face.real);
          if (typeof face.live === "number") live.push(face.live);
        }
        const needed = mode === "framing" ? FRAMING_FRAMES : 2;
        if (goodFrames >= needed && face.embedding?.length === 1024) {
          samples.push(Array.from(face.embedding));
          if (mode === "framing") {
            eyeBaseline = median(eyeReadings);
            startedAt = performance.now();
          }
          if (current >= challenge.steps.length) break;
          mode = "step";
          progress = newStepProgress();
          stepStartedAt = performance.now();
          setStepIndex(current);
          setPhase("step");
        }
      } else {
        progress = advanceStep(challenge.steps[current]!, progress, m, eyeBaseline);
        if (progress.done) {
          done.push({ kind: challenge.steps[current]!, atMs: Math.round(performance.now() - startedAt), peak: Number(progress.peak.toFixed(3)) });
          current += 1;
          mode = "settle";
          goodFrames = 0;
          stepStartedAt = performance.now();
          setStepIndex(current);
          setPhase("settle");
        }
      }
      await nextFrame();
    }
    if (!alive()) return;

    const evidence: LivenessEvidence = {
      challengeId: challenge.challengeId,
      samples: samples.slice(0, 5),
      steps: done,
      durationMs: Math.round(performance.now() - startedAt),
      frames,
      antispoof: spoof.length ? mean(spoof) : null,
      liveness: live.length ? mean(live) : null,
    };
    stopCamera();
    setPhase("sending");
    try {
      const result = await call("PUT", endpoint, evidence);
      setPhase("passed");
      onPassed(result);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "UNKNOWN";
      if (onRejected?.(code)) return;
      setError(code);
      setPhase("failed");
    }
  }, [endpoint, fail, onPassed, onRejected, stopCamera]);

  const active = phase === "framing" || phase === "step" || phase === "settle" || phase === "starting";
  const currentStep = steps[stepIndex];
  const Icon = phase === "step" && currentStep ? stepIcon[currentStep] : ScanFace;

  const instruction =
    phase === "starting" ? t.face.starting
    : phase === "sending" ? t.face.sending
    : phase === "passed" ? t.face.passed
    : phase === "step" && currentStep ? t.face.steps[currentStep]
    : phase === "settle" ? (hint === "OK" || hint === "NOT_FRONTAL" ? t.face.lookStraight : t.face.hints[hint])
    : phase === "framing" ? t.face.hints[hint]
    : "";

  return (
    <div className="space-y-5">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-[2.25rem] bg-ink shadow-(--shadow-lift)">
        {/* Mirrored like a selfie camera, so "turn right" moves the way people expect. */}
        <video ref={videoRef} playsInline muted aria-hidden className={clsx("size-full -scale-x-100 object-cover transition-opacity duration-300", active ? "opacity-100" : "opacity-0")} />
        {!active && (
          <div className="absolute inset-0 grid place-items-center">
            {phase === "sending" ? <Spinner className="size-9 text-white" /> : phase === "passed" ? <Check className="size-14 animate-pop text-white" aria-hidden /> : <ScanFace className="size-16 text-white/40" aria-hidden />}
          </div>
        )}
        {active && (
          <>
            <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
              <defs>
                <mask id="face-oval">
                  <rect width="100" height="125" fill="white" />
                  <ellipse cx="50" cy="58" rx="31" ry="41" fill="black" />
                </mask>
              </defs>
              <rect width="100" height="125" fill="rgb(15 26 20 / 0.55)" mask="url(#face-oval)" />
              <ellipse cx="50" cy="58" rx="31" ry="41" fill="none" strokeWidth="1.2" className={clsx("transition-colors duration-200", phase === "starting" ? "stroke-white/40" : hint === "OK" || phase === "step" ? "stroke-[#4ade80]" : "stroke-white")} />
            </svg>
            {phase === "starting" && (
              <div className="absolute inset-0 grid place-items-center">
                <Spinner className="size-8 text-white" />
              </div>
            )}
            {phase === "step" && currentStep && (currentStep === "TURN_LEFT" || currentStep === "TURN_RIGHT") && (
              // The preview is mirrored: the person's right is the right of the screen.
              <div className={clsx("absolute top-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/95 p-2 text-brand-deep", currentStep === "TURN_RIGHT" ? "right-3" : "left-3")}>
                {currentStep === "TURN_RIGHT" ? <ArrowRight className="size-6" aria-hidden /> : <ArrowLeft className="size-6" aria-hidden />}
              </div>
            )}
          </>
        )}
        {steps.length > 0 && active && (
          <ol className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-label={t.face.progress}>
            {steps.map((kind, i) => (
              <li key={`${kind}-${i}`} className={clsx("h-1.5 w-7 rounded-full transition-colors", i < stepIndex ? "bg-[#4ade80]" : i === stepIndex && phase === "step" ? "bg-white" : "bg-white/35")} />
            ))}
          </ol>
        )}
      </div>

      {phase === "intro" && (
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-ink-2">
            {t.face.intro.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <Button block size="lg" onClick={start}>
            <ScanFace className="size-5" aria-hidden />
            {t.face.start}
          </Button>
        </div>
      )}

      {phase !== "intro" && phase !== "failed" && (
        <p aria-live="polite" className="flex min-h-14 items-center justify-center gap-2.5 text-center text-lg font-medium text-ink">
          {(phase === "step" || phase === "framing" || phase === "settle") && <Icon className="size-5 shrink-0 text-brand" aria-hidden />}
          {instruction}
        </p>
      )}

      {phase === "failed" && (
        <div className="space-y-4">
          <Notice tone="error" title={errorText(error ?? undefined)}>
            {(error && (t.face.help as Record<string, string>)[error]) || t.face.help.DEFAULT}
          </Notice>
          <Button block size="lg" onClick={start}>
            {t.face.retry}
          </Button>
        </div>
      )}

      <p className="flex items-start justify-center gap-2 text-center text-xs text-ink-3">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t.face.privacy}
      </p>
    </div>
  );
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const mean = (xs: number[]) => Number((xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(3));
function median(xs: number[]): number {
  if (xs.length === 0) return 0.3;
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}
