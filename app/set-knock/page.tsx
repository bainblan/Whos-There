"use client";

import React, { useState, useRef, useEffect } from "react";
import Door from "../components/Door";
import ConnectButton from "../components/ConnectButton";
import RecordButton from "../components/RecordButton";
import TestKnockButton from "../components/TestKnockButton";
import AccessStatus from "../components/AccessStatus";
import BackButton from "../components/BackButton";

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
    setRecordPrompt("");
    setRecording(true);
    setAccessStatus("NONE");
    pressTimesRef.current = [];
    setRecordedRhythm([]);
    setError(null);
  };

  const handleFinishRecording = () => {
    setRecording(false);

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
    console.log("Set Knock Pattern:", intervals.join(", "), "ms");
    setRecordPrompt("");
    setError(null);
    pressTimesRef.current = [];
    setRecordedRhythm([]);
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
    setTestPrompt("");
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
      setTestPrompt("Too few knocks. Try again!");
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
      <h1 className="text-5xl font-bold text-center">RECORD YOUR KNOCK</h1>
      <div className="flex w-full max-w-8xl flex-row items-center justify-center gap-64">
        <Door knocking={uiKnockActive} open={accessStatus === "GRANTED"} onClose={() => setAccessStatus("NONE")} />
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <RecordButton recording={recording} onClick={handleStartRecording} />
          <ConnectButton connected={connected} onClick={handleConnect} />
          <TestKnockButton testing={testKnocking} onClick={handleStartTestKnocking} />
          <AccessStatus status={accessStatus} />
          <BackButton />
          {error && (
            <div className="text-red-600 font-mono text-sm">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
