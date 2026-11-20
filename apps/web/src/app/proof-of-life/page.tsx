"use client";

import { useState } from "react";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  Camera,
  Smile,
  Eye,
  AlertCircle,
  HelpCircle,
  Plane,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function ProofOfLife() {
  const [stage, setStage] = useState<"status" | "instructions" | "camera" | "done" | "travel">("status");
  const [stepPrompt, setStepPrompt] = useState(0);

  const cameraPrompts = [
    { title: "Look directly at camera", desc: "Position your face in the oval guide" },
    { title: "Blink slowly twice", desc: "Verifying passive eye liveness" },
    { title: "Turn head gently to the left", desc: "Measuring 3D depth and parallax" },
    { title: "Natural smile", desc: "Anti-spoofing challenge verification" },
  ];

  const handleNextPrompt = () => {
    if (stepPrompt < cameraPrompts.length - 1) {
      setStepPrompt(stepPrompt + 1);
    } else {
      setStage("done");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <Card className="border border-border shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Biometric Proof of Life</CardTitle>
            </div>
            <Badge variant="success">Active Status</Badge>
          </div>
          <CardDescription className="text-xs leading-relaxed">
            Annual re-verification prevents pension fraud, ghost identities, and ensures deceased persons' IDs are safely retired without paperwork.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {stage === "status" && (
            <>
              {/* Countdown Card */}
              <div className="p-5 rounded-2xl bg-secondary/50 border border-border/80 text-center space-y-2">
                <div className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                  Next Verification Due
                </div>
                <div className="text-4xl font-extrabold font-mono text-primary">62 Days</div>
                <p className="text-xs text-muted-foreground">
                  Target date: January 21, 2027 · Automated reminders will be sent at 60, 30, and 7 days.
                </p>
              </div>

              {/* Status details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                  <span className="font-medium text-foreground">Grace Period Protection</span>
                  <span className="font-mono text-muted-foreground">30 days after due date</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                  <span className="font-medium text-foreground">Verification Method</span>
                  <span className="font-mono text-muted-foreground">2-minute mobile face liveness</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                  <span className="font-medium text-foreground">Assurance Level</span>
                  <span className="font-mono font-bold text-emerald-600">LOA3 Maintained</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button className="w-full shadow-sm" onClick={() => setStage("instructions")}>
                  <span>Start 2-Minute Re-Check Now</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" className="w-full text-xs" onClick={() => setStage("travel")}>
                  <Plane className="mr-1.5 h-3.5 w-3.5" />
                  <span>I'm traveling abroad / Need an extension</span>
                </Button>
              </div>
            </>
          )}

          {stage === "instructions" && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg">What to expect</CardTitle>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  We'll ask you to follow 4 short prompts (blink, turn head, smile) using your device's camera.
                  No video is recorded or stored.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs space-y-1">
                  <div className="font-semibold text-foreground">Good lighting</div>
                  <div className="text-muted-foreground">Face a window or light source. Avoid dark backlight.</div>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border text-xs space-y-1">
                  <div className="font-semibold text-foreground">Remove sunglasses</div>
                  <div className="text-muted-foreground">Normal prescription glasses are completely fine.</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-1/3" onClick={() => setStage("status")}>
                  Cancel
                </Button>
                <Button className="w-2/3" onClick={() => { setStage("camera"); setStepPrompt(0); }}>
                  <span>Open Camera &amp; Begin</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {stage === "camera" && (
            <div className="space-y-6 text-center">
              {/* Simulated Camera Feed Frame */}
              <div className="relative w-64 h-72 mx-auto rounded-3xl bg-slate-900 border-4 border-primary/40 flex flex-col items-center justify-center text-white overflow-hidden shadow-xl">
                {/* Face Guide Oval */}
                <div className="w-40 h-52 rounded-[50%] border-2 border-dashed border-emerald-400/80 animate-pulse flex items-center justify-center">
                  <Smile className="w-16 h-16 text-emerald-400/60" />
                </div>

                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-time Liveness</span>
                </div>

                <div className="absolute bottom-3 inset-x-3 bg-black/70 backdrop-blur-sm p-2 rounded-xl text-center">
                  <div className="text-xs font-semibold text-white">
                    Step {stepPrompt + 1} of {cameraPrompts.length}
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    {cameraPrompts[stepPrompt].title}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {cameraPrompts[stepPrompt].title}
                </div>
                <p className="text-xs text-muted-foreground">
                  {cameraPrompts[stepPrompt].desc}
                </p>
              </div>

              <Button className="w-full" onClick={handleNextPrompt}>
                <span>
                  {stepPrompt === cameraPrompts.length - 1 ? "Complete Verification" : "Next Step"}
                </span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {stage === "done" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Proof of Life Re-Verified</CardTitle>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your biometric liveness test succeeded. Your Universal ID status is refreshed and confirmed active for the next 365 days.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50 border border-border text-xs font-mono text-left space-y-1">
                <div>Status: <span className="text-emerald-600 font-bold">Active (LOA3)</span></div>
                <div>Next due date: <span className="font-semibold text-foreground">November 20, 2027</span></div>
                <div>Hash signature: <span className="text-muted-foreground">0x9d4a...e12b</span></div>
              </div>

              <Button asChild className="w-full">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          )}

          {stage === "travel" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStage("status")}>
                  <ArrowRight className="h-4 w-4 rotate-180 mr-1" /> Back
                </Button>
                <CardTitle className="text-base">Travel &amp; Medical Extension</CardTitle>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                If you are a Probashi citizen residing abroad or facing medical treatment, you can request an automatic 60-day extension or authorize through an overseas Bangladesh embassy.
              </p>

              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <div className="text-xs font-semibold text-foreground">Request 60-Day Travel Grace Period</div>
                <p className="text-[11px] text-muted-foreground">
                  Attaches a verified travel flag to your ID token so banks and government services do not block operations.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    alert("Travel extension submitted. Grace period extended by 60 days.");
                    setStage("status");
                  }}
                >
                  Grant Travel Grace Period
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
