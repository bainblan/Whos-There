"use client";

import { useState, useEffect } from "react";

export default function Intro({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<
    "knock-in" | "knock-out" | "who-in" | "who-out" | "curtain" | "done"
  >("knock-in");

  useEffect(() => {
    const timings: { next: typeof phase; delay: number }[] = [
      { next: "knock-out", delay: 1400 },
      { next: "who-in", delay: 800 },
      { next: "who-out", delay: 1400 },
      { next: "curtain", delay: 800 },
      { next: "done", delay: 1200 },
    ];

    let i = 0;
    let timeout: NodeJS.Timeout;

    const step = () => {
      if (i >= timings.length) return;
      timeout = setTimeout(() => {
        const { next } = timings[i];
        setPhase(next);
        if (next === "done") {
          onComplete();
        }
        i++;
        step();
      }, timings[i].delay);
    };

    step();
    return () => clearTimeout(timeout);
  }, [onComplete]);

  if (phase === "done") return null;

  const showKnock = phase === "knock-in" || phase === "knock-out";
  const showWho = phase === "who-in" || phase === "who-out";
  const textVisible = phase === "knock-in" || phase === "who-in";
  const isCurtain = phase === "curtain";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Left curtain */}
      <div
        className="flex h-full w-1/2 items-center justify-end bg-[#4a4540] transition-transform duration-1000 ease-in-out"
        style={{ transform: isCurtain ? "translateX(-100%)" : "translateX(0)" }}
      >
        {(showKnock || showWho) && (
          <span
            className="pr-2 text-5xl font-bold tracking-tight text-white transition-opacity duration-700 md:text-6xl"
            style={{ opacity: textVisible ? 1 : 0 }}
          >
            {showKnock ? "KNOCK" : "WHO'S"}
          </span>
        )}
      </div>

      {/* Right curtain */}
      <div
        className="flex h-full w-1/2 items-center justify-start bg-[#4a4540] transition-transform duration-1000 ease-in-out"
        style={{ transform: isCurtain ? "translateX(100%)" : "translateX(0)" }}
      >
        {(showKnock || showWho) && (
          <span
            className="pl-2 text-5xl font-bold tracking-tight text-white transition-opacity duration-700 md:text-6xl"
            style={{ opacity: textVisible ? 1 : 0 }}
          >
            {showKnock ? "KNOCK" : "THERE?"}
          </span>
        )}
      </div>
    </div>
  );
}
