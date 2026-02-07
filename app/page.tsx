"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Intro from "./components/Intro";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  return (
    <>
      {!introDone && <Intro onComplete={handleIntroComplete} />}
      <div className="flex h-screen flex-col items-center justify-center gap-8 px-4">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Knock</h1>
        <div className="flex gap-6">
          <Link
            href="/main"
            className="rounded-lg border-2 border-white bg-sky-400 px-8 py-4 text-lg font-bold text-white"
          >
            SET YOUR OWN KNOCK
          </Link>
          <Link
            href="/main"
            className="rounded-lg border-2 border-white bg-sky-400 px-8 py-4 text-lg font-bold text-white"
          >
            RANDOMLY GENERATE KNOCK
          </Link>
        </div>
      </div>
    </>
  );
}
