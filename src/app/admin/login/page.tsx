"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg p-8"
      >
        <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Admin<span className="text-brand">.</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/40 mb-8">
          Enter password to continue
        </p>

        {error && (
          <div className="text-brand text-xs font-semibold mb-4">{error}</div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand transition-colors"
          autoFocus
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-brand text-white text-xs font-bold uppercase tracking-[.15em] py-3 rounded hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
