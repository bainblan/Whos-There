"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle LOGIN button click: search for user, display error if not found
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = username.trim();
    if (!name) return;

    // Query Supabase for the username
    const { data, error: dbError } = await supabase
      .from("Username")
      .select("*")
      .eq("username", name)
      .single();

    if (dbError || !data) {
      setError(`No one with "${name}" exists in our neighborhood`);
      return;
    }

    // You might want to set session here as in original logic, can add if needed
    router.push("/set-knock");
  };

  // Optional: handle CREATE ACCOUNT button logic (original code submitted name by upsert)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = username.trim();
    if (!name) return;

    // Ensure anonymous session for demo
    let { data } = await supabase.auth.getSession();
    let session = data.session;

    if (!session) {
      await supabase.auth.signInAnonymously();
      session = (await supabase.auth.getSession()).data.session;
    }

    if (!session) return;

    // Upsert username to the database
    await supabase.from("Username").upsert({
      id: session.user.id,
      username: name,
    });

    router.push("/set-knock");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
      <form className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30"
        />
        {error && (
          <div className="text-red-600 text-sm font-semibold rounded bg-red-50 px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleLogin}
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white cursor-pointer"
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={handleCreateAccount}
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white cursor-pointer"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </form>
    </div>
  );
}
