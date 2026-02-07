"use client";

import React, { useState, useRef, useEffect } from "react";
import Door from "./Door";
import BackButton from "./BackButton";

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
  const [recordPrompt, setRecordPrompt] = useState<string>(""); // Will be used for instructions during recording
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
    setRecordPrompt(
      "Start knocking the K key for each beat of your pattern. Press Enter when finished."
    );
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
      setRecordPrompt(
        "Too few knocks! Press 'SET KNOCK PASSWORD' and try again."
      );
      return;
    }
    const intervals = [];
    for (let i = 1; i < times.length; ++i) {
      intervals.push(Math.round(times[i] - times[i - 1]));
    }
    setKnockPassword(intervals);
    // Instead of displaying the pattern in the UI, put it in the console
    console.log("Set Knock Pattern:", intervals.join(", "), "ms");
    setRecordPrompt(""); // Do not display in UI after recording
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
      alert(data);
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

    // Calculate intervals in ms between knocks
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
  // Button disabling logic: during RECORDING or TEST KNOCK, all other buttons should be disabled
  // SET KNOCK PASSWORD disables when recording, TEST KNOCK disables when testKnocking,
  // and all other three are disabled when either recording or testKnocking is true
  const anyInputActive = recording || testKnocking;

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-8 mt-10">
      <h1 className="text-5xl font-bold w-full text-center">RECORD YOUR KNOCK</h1>
      {/* Knock UI Feedback */}
      <Door
        knocking={uiKnockActive}
        open={accessStatus === "GRANTED"}
        onClose={() => setAccessStatus("NONE")}
      />
      <div className="flex w-full flex-col gap-4">
        <button
          onClick={handleConnect}
          disabled={connected || anyInputActive}
          className={`w-full px-6 py-3 rounded bg-blue-600 text-white font-semibold transition-opacity ${
            connected || anyInputActive
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
          id="connectBtn"
        >
          {connected ? "Connected!" : "CONNECT TO SENSOR"}
        </button>
        <button
          onClick={handleStartRecording}
          disabled={recording || testKnocking}
          className={`w-full px-6 py-3 rounded bg-yellow-500 text-white font-semibold transition-opacity ${
            (recording || testKnocking)
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-yellow-600"
          }`}
          id="recordBtn"
          tabIndex={0}
        >
          {recording
            ? "Recording... (K key = knock, Enter = done)"
            : "SET KNOCK PASSWORD"}
        </button>
        {/* Show the recording prompt under SET KNOCK PASSWORD, but only during recording */}
        {recording && recordPrompt && (
          <div className="w-full text-center text-base text-yellow-800 bg-yellow-50 py-2 rounded mb-2 font-mono border border-yellow-200">
            {recordPrompt}
          </div>
        )}

        <button
          onClick={handleStartTestKnocking}
          disabled={testKnocking || recording}
          className={`w-full px-6 py-3 rounded bg-purple-600 text-white font-semibold transition-opacity ${
            (testKnocking || recording)
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-purple-700"
          }`}
          id="testKnockBtn"
          tabIndex={0}
        >
          {testKnocking
            ? "Testing... (K key = knock, Enter = test match)"
            : "TEST KNOCK"}
        </button>
        {/* Show the test knock prompt under TEST KNOCK, but only during testKnocking */}
        {testKnocking && testPrompt && (
          <div className="w-full text-center text-base text-purple-800 bg-purple-50 py-2 rounded mb-2 font-mono border border-purple-200">
            {testPrompt}
          </div>
        )}
        {/* Access status – rhythm validation */}
        {accessStatus !== "NONE" && (
          <div
            className={`w-full px-6 py-3 rounded text-center text-lg font-mono font-bold transition-all ${
              accessStatus === "GRANTED"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {accessStatus === "GRANTED" ? "ACCESS GRANTED" : "ACCESS DENIED"}
          </div>
        )}
        {/* Disable logout/back only during knock/password recording OR test knock */}
        <div className={anyInputActive ? "pointer-events-none opacity-60" : ""}>
          <BackButton />
        </div>
      </div>
      {error && (
        <div className="mt-4 text-red-600 font-mono text-sm">{error}</div>
      )}
    </div>
  );
}