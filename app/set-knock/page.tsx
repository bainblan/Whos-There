"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Door from "../components/Door";
import ConnectButton from "../components/ConnectButton";
import RecordButton from "../components/RecordButton";
import TestKnockButton from "../components/TestKnockButton";
import AccessStatus from "../components/AccessStatus";
import BackButton from "../components/BackButton";
import MagicButton from "../components/MagicButton";
import { getSession } from "../../lib/session";

const TOLERANCE = 200; // Allowable error margin (plus or minus 200ms)

/**
 * Compare two rhythm arrays, allowing small errors in timing.
 */
function validateRhythm(recorded: number[], password: number[]): boolean {
  if (!password || password.length === 0) return false;
  if (recorded.length !== password.length) {
    console.log(`Wrong count: Got ${recorded.length}, expected ${password.length}`);
    return false;
  }
  const isMatch = recorded.every((val, idx) => {
    const expected = password[idx];
    const diff = Math.abs(val - expected);
    console.log(`Gap ${idx + 1}: Got ${val}ms, Expected ${expected}ms (Diff: ${diff}ms)`);
    return diff <= TOLERANCE;
  });
  return isMatch;
}

export default function SetKnock() {
  const router = useRouter();
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [uiKnockActive, setUiKnockActive] = useState(false);
  const [accessStatus, setAccessStatus] = useState<"NONE" | "GRANTED" | "DENIED">("NONE");
  const [error, setError] = useState<string | null>(null);

  // Knock password state
  const [recording, setRecording] = useState(false);
  const [knockPassword, setKnockPassword] = useState<number[] | null>(null);
  const knockPasswordRef = useRef<number[] | null>(null);
  const [recordPrompt, setRecordPrompt] = useState<string>("");
  const [recordedRhythm, setRecordedRhythm] = useState<number[]>([]);

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);

  // LOCAL TEST MODE STATE FOR KNOCK MATCHING
  const [testKnocking, setTestKnocking] = useState(false);
  const [testPrompt, setTestPrompt] = useState<string>("");
  const testPressTimesRef = useRef<number[]>([]);

  // Timing for knock recording
  const pressTimesRef = useRef<number[]>([]);

  // Always keep knockPasswordRef in sync with latest knockPassword
  useEffect(() => {
    knockPasswordRef.current = knockPassword;
  }, [knockPassword]);

  // Load session username from JWT cookie for welcome message
  useEffect(() => {
    getSession().then((session) => {
      setSessionUsername(session?.username ?? null);
    });
  }, []);

  // Handle K key knock password entry
  React.useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyK") {
        const now = performance.now();
        pressTimesRef.current.push(now);
        setUiKnockActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyK") {
        setUiKnockActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recording]);

  // TEST: handle K-key for test knock matching
  React.useEffect(() => {
    if (!testKnocking) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyK") {
        const now = performance.now();
        testPressTimesRef.current.push(now);
        setUiKnockActive(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyK") {
        setUiKnockActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [testKnocking]);

  // Start recording on button click
  const handleStartRecording = () => {
    setRecordPrompt(
      "Start knocking the K key for each beat of your pattern. Press Enter when finished."
    );
    setRecording(true);
    setAccessStatus("NONE");
    pressTimesRef.current = [];
    setRecordedRhythm([]);
    setError(null);
    setAiDescription(null); // Clear AI text if manual recording starts
  };

  const handleFinishRecording = () => {
    setRecording(false);

    const times = pressTimesRef.current;
    if (times.length < 2) {
      setError("Must record at least 2 knocks.");
      setRecordPrompt("Too few knocks! Press 'RECORD' and try again.");
      return;
    }
    const intervals = [];
    for (let i = 1; i < times.length; ++i) {
      intervals.push(Math.round(times[i] - times[i - 1]));
    }
    setKnockPassword(intervals);
    console.log("Set Knock Pattern:", intervals.join(", "), "ms");
    setRecordPrompt("");
    setError(null);
    pressTimesRef.current = [];
    setRecordedRhythm([]);
  };

  // --- AI GENERATION LOGIC ---
  const handleAiSubmit = async (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setError(null);
    setAiDescription(null);

    try {
      const res = await fetch("/api/rhythm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "custom",
          userPrompt: aiPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate rhythm");
      }

      // Success! Update the password
      setKnockPassword(data.intervals);
      setAiDescription(data.description);
      setRecordPrompt("AI Rhythm Loaded! Try 'Test Knock' to verify.");
      
    } catch (err: any) {
      setError("AI Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Helper to hear the AI rhythm (Simple beep)
  const playCurrentRhythm = () => {
    if (!knockPassword) return;
    
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const startTime = ctx.currentTime;

    // First knock is immediate
    playTone(ctx, startTime);

    let currentDelay = 0;
    knockPassword.forEach((interval) => {
      currentDelay += interval / 1000;
      playTone(ctx, startTime + currentDelay);
    });
  };

  const playTone = (ctx: AudioContext, time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 150; // Low thud
    osc.type = "square";
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };
  // ---------------------------

  // Listen for Enter key to finish recording
  React.useEffect(() => {
    if (!recording) return;
    const onEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleFinishRecording();
      }
    };
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
    // eslint-disable-next-line
  }, [recording]);

  // TEST: Listen for Enter key to finish 'test knock'
  React.useEffect(() => {
    if (!testKnocking) return;
    const onEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleFinishTestKnocking();
      }
    };
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
    // eslint-disable-next-line
  }, [testKnocking]);

  // Validate incoming ESP32 knock rhythm with the set password
  const handleSerialData = (rawData: string) => {
    const data = rawData.trim();

    if (data === "1") {
      setUiKnockActive(true);
      return;
    }
    if (data === "0") {
      setUiKnockActive(false);
      return;
    }

    if (data.startsWith("DATA:")) {
      const csvPart = data.split(":")[1];
      const intervals = csvPart.split(",").map(Number);

      console.log("Recorded Pattern:", intervals);
      setRecordedRhythm(intervals);

      if (intervals.length > 0) {
        console.log(`Latest Knock: ${intervals.join(", ")} ms`);
      }

      const currentKnockPassword = knockPasswordRef.current;

      if (!currentKnockPassword || currentKnockPassword.length === 0) {
        setAccessStatus("NONE");
        setError("No knock password set! Please record knock password first.");
        return;
      }

      const success = validateRhythm(intervals, currentKnockPassword);

      if (success) {
        setAccessStatus("GRANTED");
        setError(null);
      } else {
        setAccessStatus("DENIED");
        setError(null);
      }
    }
  };

  // Handles connecting and streaming serial input
  const handleConnect = async () => {
    setError(null);
    try {
      // @ts-ignore: 'serial' may not exist on all browsers
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 921600 });

      setConnected(true);

      // @ts-ignore: TextDecoderStream may not exist on all browsers
      const textDecoder = new TextDecoderStream();
      // @ts-ignore: pipeTo may not exist
      port.readable.pipeTo(textDecoder.writable);
      // @ts-ignore
      const reader = textDecoder.readable.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (typeof value === "string") {
          handleSerialData(value);
        }
      }
    } catch (err: any) {
      setError("Serial Connection Failed: " + (err?.message ?? String(err)));
    }
  };

  // TEST: handle test knock button click
  const handleStartTestKnocking = () => {
    setTestPrompt(
      "Start knocking the K key to test your pattern. Press Enter when finished."
    );
    setTestKnocking(true);
    setError(null);
    setAccessStatus("NONE");
    testPressTimesRef.current = [];
    setUiKnockActive(false);
    setRecordedRhythm([]);
  };

  // TEST: handle finish test knock and validate locally
  const handleFinishTestKnocking = () => {
    setTestKnocking(false);

    const times = testPressTimesRef.current;
    if (times.length < 2) {
      setError("Must perform at least 2 test knocks.");
      setTestPrompt("Too few knocks! Press 'TEST KNOCK' and try again.");
      return;
    }
    const intervals: number[] = [];
    for (let i = 1; i < times.length; ++i) {
      intervals.push(Math.round(times[i] - times[i - 1]));
    }

    setRecordedRhythm(intervals);

    if (intervals.length > 0) {
      console.log(`Latest Knock: ${intervals.join(", ")} ms`);
    }

    if (!knockPassword || knockPassword.length === 0) {
      setAccessStatus("NONE");
      setError("No knock password set! Please record knock password first.");
      setTestPrompt("No knock password set. Record one first!");
      return;
    }

    const success = validateRhythm(intervals, knockPassword);
    if (success) {
      setAccessStatus("GRANTED");
      setError(null);
      console.log("Knock match successful! (Test)");
      setTestPrompt("");
    } else {
      setAccessStatus("DENIED");
      setError(null);
      console.log("Knock pattern did not match! (Test)");
      setTestPrompt("");
    }
    testPressTimesRef.current = [];
  };

  return (
    <div className="flex min-h-screen flex-col gap-24 items-center py-12 px-4">
      <h1 className="text-5xl font-bold text-center">
        Welcome to {sessionUsername ?? "Unkown"}&apos;s Home
      </h1>
      <div className="flex w-full max-w-8xl flex-row items-center justify-center gap-32">
        <Door knocking={uiKnockActive} open={accessStatus === "GRANTED"} onClose={() => setAccessStatus("NONE")} />
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <RecordButton recording={recording} onClick={handleStartRecording} />
          <MagicButton
            disabled={recording || testKnocking}
            onGenerated={(intervals, description) => {
              setKnockPassword(intervals);
              setAiDescription(description);
              setRecordPrompt("Random Rhythm Loaded! Try 'Test Knock' to verify.");
              setError(null);
            }}
            onError={(msg) => setError("Magic Error: " + msg)}
          />
          {recording && recordPrompt && (
            <div className="w-full text-center text-base text-yellow-800 bg-yellow-50 py-2 rounded mb-2 font-mono border border-yellow-200">
              {recordPrompt}
            </div>
          )}
          <ConnectButton
            connected={connected}
            onClick={handleConnect}
            disabled={recording || testKnocking}
          />
          <TestKnockButton
            testing={testKnocking}
            onClick={handleStartTestKnocking}
            disabled={recording}
          />
          {testKnocking && testPrompt && (
            <div className="w-full text-center text-base text-purple-800 bg-purple-50 py-2 rounded mb-2 font-mono border border-purple-200">
              {testPrompt}
            </div>
          )}
          <AccessStatus status={accessStatus} />
          <BackButton
            disabled={recording || testKnocking}
            onClick={async () => {
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
              router.push("/login");
            }}
          />
          {error && (
            <div className="text-red-600 font-mono text-sm">{error}</div>
          )}
          
          {/* AI INPUT SECTION */}
          <div className="flex flex-col gap-2 mt-4">
             <div className="flex gap-2">
                <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={handleAiSubmit}
                    disabled={aiLoading}
                    placeholder="Ask the magical AI for a rhythm..."
                    className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30 disabled:opacity-50"
                />
                <button 
                  onClick={() => handleAiSubmit()} 
                  disabled={aiLoading || !aiPrompt}
                  className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {aiLoading ? "..." : "Go"}
                </button>
             </div>

            <div className="w-full rounded-lg border border-foreground/10 bg-foreground/5 p-4 min-h-[80px] flex items-center justify-between">
                <div>
                  {aiDescription ? (
                    <p className="text-foreground font-semibold">{aiDescription}</p>
                  ) : (
                    <p className="text-foreground/60">AI response will appear here.</p>
                  )}
                </div>
                {aiDescription && knockPassword && (
                    <button 
                       onClick={playCurrentRhythm}
                       className="ml-4 p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-bold"
                    >
                       ▶ Play
                    </button>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}