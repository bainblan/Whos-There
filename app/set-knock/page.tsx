"use client";

import Link from "next/link";
import Knock from "../components/Knock";

export default function SetKnock() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight">Set Your Own Knock</h1>
      <Knock />
      <Link
        href="/main"
        className="rounded-lg bg-sky-400 px-8 py-3 text-lg font-bold text-white"
      >
        CONTINUE
      </Link>
    </div>
  );
}
