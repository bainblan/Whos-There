"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

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

export default function Knock() {
  const [connected, setConnected] = useState(false);
  const [uiKnockActive, setUiKnockActive] = useState(false);
  const [accessStatus, setAccessStatus] = useState<"NONE" | "GRANTED" | "DENIED">("NONE");
  const [error, setError] = useState<string | null>(null);

  // Knock password state
  const [recording, setRecording] = useState(false);
  const [knockPassword, setKnockPassword] = useState<number[] | null>(null); // array of ms intervals
  const knockPasswordRef = useRef<number[] | null>(null); // Persistently track knock password for serial event closure
  const [recordPrompt, setRecordPrompt] = useState<string>(""); // Prompt removed per instructions
  const [recordedRhythm, setRecordedRhythm] = useState<number[]>([]);

  // LOCAL TEST MODE STATE FOR KNOCK MATCHING
  const [testKnocking, setTestKnocking] = useState(false);
  const [testPrompt, setTestPrompt] = useState<string>(""); // Cleared default prompt per instructions
  const testPressTimesRef = useRef<number[]>([]);

  // Timing for knock recording
  const pressTimesRef = useRef<number[]>([]);

  // Always keep knockPasswordRef in sync with latest knockPassword
  useEffect(() => {
    knockPasswordRef.current = knockPassword;
  }, [knockPassword]);

  // Handle K key knock password entry
  React.useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only accept 'k' or 'K' key (code "KeyK"); ignore space and others.
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
    setRecordPrompt(""); // Clear or keep prompt empty per instructions
    setRecording(true);
    setAccessStatus("NONE");
    pressTimesRef.current = [];
    setRecordedRhythm([]);
    setError(null);
  };

  const handleFinishRecording = () => {
    setRecording(false);

    // Calculate intervals in ms between knocks
    const times = pressTimesRef.current;
    if (times.length < 2) {
      setError("Must record at least 2 knocks.");
      setRecordPrompt("");
      return;
    }
    const intervals = [];
    for (let i = 1; i < times.length; ++i) {
      intervals.push(Math.round(times[i] - times[i - 1]));
    }
    setKnockPassword(intervals);
    // Instead of displaying the pattern in the UI, put it in the console
    console.log("Set Knock Pattern:", intervals.join(", "), "ms");
    setRecordPrompt(""); // Do not display in UI
    setError(null);
    pressTimesRef.current = [];
    setRecordedRhythm([]);
    // No need to directly update ref; useEffect for knockPassword syncs knockPasswordRef
  };

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

  // TEST: Listen for Enter key to finish 'test knock', and trigger local validation
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
  // MODIFIED: use ref to ensure latest knockPassword is always checked,
  // not a stale copy within the serial event closure.
  const handleSerialData = (rawData: string) => {
    const data = rawData.trim();

    // 1. Instant UI Feedback
    if (data === "1") {
      setUiKnockActive(true);
      return;
    }
    if (data === "0") {
      setUiKnockActive(false);
      return;
    }

    // 2. Rhythm Validation
    if (data.startsWith("DATA:")) {
      const csvPart = data.split(":")[1];
      const intervals = csvPart.split(",").map(Number);

      console.log("Recorded Pattern:", intervals);

      // Also show the last received knock for debugging
      setRecordedRhythm(intervals);

      // Output "Latest Knock:" to the console instead of UI
      if (intervals.length > 0) {
        console.log(`Latest Knock: ${intervals.join(", ")} ms`);
      }

      // *** CRITICAL FIX ***
      // Use most up-to-date knockPassword, not stale closure!
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
      // 1. Request port and open connection
      // @ts-ignore: 'serial' may not exist on all browsers
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 921600 });

      setConnected(true);

      // 2. Set up a text decoder to read strings
      // @ts-ignore: TextDecoderStream may not exist on all browsers
      const textDecoder = new TextDecoderStream();
      // @ts-ignore: pipeTo may not exist
      port.readable.pipeTo(textDecoder.writable);
      // @ts-ignore
      const reader = textDecoder.readable.getReader();

      // 3. Read Loop
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
    setTestPrompt(""); // No instruction message
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

    // Calculate intervals in ms between knocks
    const times = testPressTimesRef.current;
    if (times.length < 2) {
      setError("Must perform at least 2 test knocks.");
      setTestPrompt("Too few knocks. Try again!");
      return;
    }
    const intervals: number[] = [];
    for (let i = 1; i < times.length; ++i) {
      intervals.push(Math.round(times[i] - times[i - 1]));
    }

    setRecordedRhythm(intervals);

    // Output "Latest Knock:" to the console instead of UI
    if (intervals.length > 0) {
      console.log(`Latest Knock: ${intervals.join(", ")} ms`);
    }

    if (!knockPassword || knockPassword.length === 0) {
      setAccessStatus("NONE");
      setError("No knock password set! Please record knock password first.");
      setTestPrompt("No knock password set. Record one first!");
      return;
    }

    // Simulate ESP32 message: validateRhythm
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

  // UI rendering for knock highlight & rhythm validation status
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-8 mt-10">
      <h1 className="text-5xl font-bold w-full text-center">RECORD YOUR KNOCK</h1>
      {/* Knock UI Feedback */}
      <div className="relative h-[360px] w-[300px]">
        <Image
          src="/Door Closed.png"
          alt="Door closed"
          width={200}
          height={360}
          className="absolute left-1/2 top-0 h-full w-auto -translate-x-1/2 object-contain"
          priority
        />
        <Image
          src={uiKnockActive ? "/knock 45 deg.svg" : "/knock hand.svg"}
          alt={uiKnockActive ? "Knocking hand" : "Hand ready to knock"}
          width={100}
          height={100}
          className={`absolute top-1/3 transition-all duration-100 ${uiKnockActive ? "right-[40px]" : "right-0"}`}
        />
      </div>
      <div className="flex w-full flex-col gap-4">
        <button
          onClick={handleConnect}
          disabled={connected}
          className={`w-full px-6 py-3 rounded bg-blue-600 text-white font-semibold transition-opacity ${
            connected ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
          id="connectBtn"
        >
          {connected ? "Connected!" : "Connect to Sensor"}
        </button>
        <button
          onClick={handleStartRecording}
          disabled={recording}
          className={`w-full px-6 py-3 rounded bg-yellow-500 text-white font-semibold transition-opacity ${
            recording ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
          }`}
          id="recordBtn"
          tabIndex={0}
        >
          {recording
            ? "Recording... (K key = knock, Enter = done)"
            : "Record Knock Password"}
        </button>
        <button
          onClick={handleStartTestKnocking}
          disabled={testKnocking}
          className={`w-full px-6 py-3 rounded bg-purple-600 text-white font-semibold transition-opacity ${
            testKnocking ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
          }`}
          id="testKnockBtn"
          tabIndex={0}
        >
          {testKnocking
            ? "Testing... (K key = knock, Enter = test match)"
            : "Test Knock (Simulate Sensor)"}
        </button>
      </div>
      {/* Access status – rhythm validation */}
      {accessStatus !== "NONE" && (
        <div
          className={`mt-2 px-6 py-3 rounded text-lg font-mono font-bold transition-all ${
            accessStatus === "GRANTED"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {accessStatus === "GRANTED" ? "ACCESS GRANTED" : "ACCESS DENIED"}
        </div>
      )}
      {/* Show knock rhythm received for debugging */}
      {/* Latest Knock is now only output to console and not displayed in UI */}
      {error && (
        <div className="mt-4 text-red-600 font-mono text-sm">{error}</div>
      )}
    </div>
  );
}