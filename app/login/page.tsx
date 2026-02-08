"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle LOGIN: check username in Supabase via API, then set session cookie
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = username.trim();
    if (!name) return;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data?.error ?? "Login failed");
      return;
    }

    router.push("/set-knock");
  };

  // Optional: handle CREATE ACCOUNT button logic (original code submitted name by upsert)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = username.trim();
    if (!name) return;

    setLoading(true);

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

    // Create session cookie so user is logged in (knock pattern may be empty until set)
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name }),
      credentials: "include",
    });
    router.push("/set-knock");
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 px-4">
      <h1 className="fade-in text-4xl font-bold tracking-tight">Welcome</h1>
      <form className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="text"
          placeholder="Enter username..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="fade-in rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30"
          style={{ animationDelay: "0.15s" }}
        />
        {error && (
          <div className="text-red-600 text-sm font-semibold rounded bg-red-50 px-3 py-2">
            {error}
          </div>
        )}
        <div className="fade-in flex gap-4" style={{ animationDelay: "0.3s" }}>
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={loading}
            className="flex-1 rounded-lg border-2 border-white bg-sky-400 py-3 text-lg font-bold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CREATE ACCOUNT
          </button>
        </div>
        {loading && (
          <div className="flex justify-center">
            <span className="h-6 w-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>
    </div>
  );
}
