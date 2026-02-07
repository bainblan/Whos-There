"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient"; // ✅ ADD

export default function Login() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  // 🔧 CHANGED: async + Supabase logic added (no code removed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) return;

    // ✅ ensure user session (anonymous for demo)
    let { data } = await supabase.auth.getSession();
    let session = data.session;

    if (!session) {
      await supabase.auth.signInAnonymously();
      session = (await supabase.auth.getSession()).data.session;
    }

    if (!session) return;

    // ✅ WRITE USERNAME TO DATABASE
    await supabase.from("Username").upsert({
      id: session.user.id,
      username: username.trim(),
    });

    router.push("/set-knock");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30"
        />
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white"
          >
            LOG IN
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </form>
    </div>
  );
}
