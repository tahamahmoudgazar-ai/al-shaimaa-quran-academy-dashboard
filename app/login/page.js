"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./login.module.css";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

async function handleLogin(e) {
  e.preventDefault();

  setError("");
  setLoading(true);

  try {
    const result = await Promise.race([
      supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login request timed out")), 10000)
      ),
    ]);

    console.log("LOGIN RESULT:", result);

    if (result.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to load your account.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      setError("Account profile not found.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
    } else if (profile.role === "teacher") {
      router.push("/teacher");
    } else if (profile.role === "student") {
      router.push("/student");
    } else {
      setError("Invalid account role.");
      setLoading(false);
      return;
    }

    router.refresh();
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    setError("Unable to sign in. Please try again.");
    setLoading(false);
  }
}
  return (
    <main className={styles.page}>
      <section className={styles.card}>

        <div className={styles.brand}>
          <div className={styles.logo}>AQ</div>

          <div>
            <h1>Al Shaimaa</h1>
            <p>Quran Academy</p>
          </div>
        </div>

        <div className={styles.heading}>
          <h2>Welcome back</h2>
          <p>Sign in to your academy account.</p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleLogin}
        >
          <label>
            Email

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div
              style={{
                background: "#fff5f5",
                border: "1px solid #fed7d7",
                color: "#c53030",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div className={styles.row}>
            <label className={styles.remember}>
              <input type="checkbox" />
              Remember me
            </label>

            <span className={styles.link}>
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.demo}>
          Sign in with your academy account.
        </p>

      </section>
    </main>
  );
}
