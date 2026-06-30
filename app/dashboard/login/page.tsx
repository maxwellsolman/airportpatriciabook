"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/dashboard/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace(next);
    } else {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg,var(--cream),var(--cream-2))",
        padding: "1.5rem",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          border: "1px solid var(--paper-edge)",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 24px 60px -30px rgba(20,31,48,0.35)",
        }}
      >
        <div className="kicker" style={{ color: "var(--brass-deep)" }}>
          Airport Patricia
        </div>
        <h1 style={{ fontSize: "1.6rem", marginTop: "0.5rem" }}>Analytics</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: "0.4rem" }}>
          Enter the password to view the dashboard.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            marginTop: "1.2rem",
            padding: "0.8rem 1rem",
            borderRadius: 10,
            border: `1px solid ${error ? "#c0392b" : "var(--paper-edge)"}`,
            fontSize: "1rem",
            fontFamily: "var(--font-ui)",
            outline: "none",
          }}
        />
        {error && (
          <p style={{ color: "#c0392b", fontSize: "0.82rem", marginTop: "0.5rem" }}>
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-block"
          style={{ marginTop: "1.1rem", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Checking…" : "Enter dashboard"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
