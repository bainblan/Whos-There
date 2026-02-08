"use client";

import Link from "next/link";
import { useState } from "react";
import useAudio from "../../lib/useAudio";

export default function RandomKnock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIntervals, setLastIntervals] = useState<number[] | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [soundType, setSoundType] = useState<"knock" | "click" | "bell" | "wood">("knock");
  const { playSequence, resumeAudio } = useAudio();

  const generateAndPlay = async () => {
    setError(null);
    setLoading(true);
    try {
      // Ensure audio context started by a user gesture
      await resumeAudio();

      const res = await fetch("/api/rhythm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "random" }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      // Expecting { description, intervals }
      const intervals: number[] = Array.isArray(data?.intervals) ? data.intervals : [];
      const desc = typeof data?.description === "string" ? data.description : null;

      setLastIntervals(intervals.length ? intervals : null);
      setDescription(desc);

      if (intervals && intervals.length > 0) {
        playSequence(intervals, soundType);
      } else {
        setError("No rhythm returned");
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Random Knock</h1>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={generateAndPlay}
          disabled={loading}
          className={`rounded-lg bg-sky-500 px-6 py-3 text-lg font-bold text-white transition-opacity ${
            loading ? "opacity-60 cursor-not-allowed" : "hover:bg-sky-600"
          }`}
        >
          {loading ? "Generating..." : "Generate & Play Random Knock"}
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Sound:</label>
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as "knock" | "click" | "bell" | "wood")}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value="knock">Knock</option>
              <option value="click">Click</option>
              <option value="bell">Bell</option>
              <option value="wood">Wood</option>
            </select>
            <button
              disabled={!lastIntervals}
              onClick={() => {
                if (lastIntervals) playSequence(lastIntervals, soundType);
              }}
              className={`ml-2 rounded bg-gray-800 px-3 py-1 text-sm text-white ${
                !lastIntervals ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900 cursor-pointer"
              }`}
            >
              Replay
            </button>
          </div>

          {lastIntervals && (
            <div className="text-xs font-mono text-gray-700">Pattern: {lastIntervals.join(", ")} ms</div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
}
