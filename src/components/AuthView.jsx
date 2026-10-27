"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { showToast } from "./Toast";
import Navbar from "./Navbar";

export default function AuthView({ initialMode = "signin" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signInWithDemo } = useAuth();

  const [mode, setMode] = useState(initialMode); // "signin" | "signup" | "magic"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  async function handlePasswordAuth(e) {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!email || !email.includes("@")) {
      setAuthError("Please enter a valid work email address.");
      return;
    }

    if (mode !== "magic" && (!password || password.length < 6)) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setAuthError("Invalid email or password. If you don't have an account, please sign up.");
          } else {
            setAuthError(error.message);
          }
          setLoading(false);
          return;
        }

        showToast("Signed in successfully! Welcome back.", "success");
        router.push(redirectUrl);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          showToast("Account created successfully! Welcome to RevAtlas.", "success");
          router.push(redirectUrl);
        } else {
          setAuthSuccess(
            "Account created! Please check your email inbox to confirm your account and get started."
          );
          showToast("Confirmation email sent! Check your inbox.", "info");
        }
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          },
        });

        if (error) {
          setAuthError(error.message);
          setLoading(false);
          return;
        }

        setAuthSuccess(`Magic login link sent to ${email}! Click the link in your email to sign in.`);
        showToast("Magic login link sent!", "success");
      }
    } catch (err) {
      setAuthError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider) {
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) {
        setAuthError(`${provider.toUpperCase()} sign in: ${error.message}`);
      }
    } catch (e) {
      setAuthError(`Unable to initiate ${provider} login: ${e.message}`);
    }
  }

  function handleDemoLogin() {
    signInWithDemo();
    showToast("Logged in as Demo Pro Member!", "success");
    router.push(redirectUrl);
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main className="auth-page-wrapper">
        <div className="auth-container">
          {/* Left Hero Card */}
          <div className="auth-hero-pane">
            <div className="auth-badge-pill">
              <span className="live-dot" />
              <span>Real-Time SaaS Financial Intelligence</span>
            </div>

            <h1 className="auth-hero-title">
              Track 72,000+ Verified SaaS Balance Sheets
            </h1>

            <p className="auth-hero-desc">
              Join over 18,400+ SaaS founders, private equity investors, and revenue operators
              sourcing deal intelligence and competitor ARR benchmarks.
            </p>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📊</span>
                <div>
                  <strong>Verified ARR & Multiples</strong>
                  <p>Modelled revenue trajectory, MRR run-rate, and EV/ARR multiples from 2022 to 2026.</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔍</span>
                <div>
                  <strong>Executive & Team Intel</strong>
                  <p>Founders, headcount metrics, detected tech stacks, and verified work email paths.</p>
                </div>
              </div>

              <div className="auth-feature-item">
                <span className="auth-feature-icon">⚡</span>
                <div>
                  <strong>1-Click CSV Exports & REST API</strong>
                  <p>Filter by ARR ($1M–$50M+), capital efficiency, and export lists in clean formats.</p>
                </div>
              </div>
            </div>

            <div className="auth-social-proof">
              <div className="auth-proof-stat">
                <span className="proof-num">72,032</span>
                <span className="proof-label">SaaS Companies</span>
              </div>
              <div className="auth-proof-stat">
                <span className="proof-num">$400B+</span>
                <span className="proof-label">Tracked ARR</span>
              </div>
              <div className="auth-proof-stat">
                <span className="proof-num">18.4K</span>
                <span className="proof-label">Active Operators</span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="auth-form-card">
            {/* Mode Tabs */}
            <div className="auth-tabs-row">
              <button
                type="button"
                className={`auth-tab-btn ${mode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setMode("signin");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                Create Account
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === "magic" ? "active" : ""}`}
                onClick={() => {
                  setMode("magic");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                title="Passwordless email link"
              >
                Magic Link
              </button>
            </div>

            <div className="auth-card-header">
              <h2 className="auth-card-title">
                {mode === "signin" && "Welcome back to RevAtlas"}
                {mode === "signup" && "Create your free RevAtlas account"}
                {mode === "magic" && "Passwordless Sign In"}
              </h2>
              <p className="auth-card-subtitle">
                {mode === "signin" && "Enter your work email and password to access your dashboard."}
                {mode === "signup" && "Get instant access to 72,000+ SaaS metrics and 100 free credits."}
                {mode === "magic" && "We'll send a secure one-click sign-in link to your email."}
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="auth-alert error">
                <span className="alert-icon">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccess && (
              <div className="auth-alert success">
                <span className="alert-icon">✓</span>
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordAuth} className="auth-form">
              {mode === "signup" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Gourav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Work Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="founder@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== "magic" && (
                <div className="form-group">
                  <div className="label-row">
                    <label className="form-label" htmlFor="password">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="btn-text-link"
                        onClick={() => {
                          setMode("magic");
                          setAuthError("");
                          setAuthSuccess("");
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="password-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((p) => !p)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-spinner">Loading...</span>
                ) : (
                  <>
                    {mode === "signin" && "Sign In with Email →"}
                    {mode === "signup" && "Create Free Account →"}
                    {mode === "magic" && "Send Magic Login Link ✉️"}
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR CONTINUE WITH</span>
            </div>

            {/* Social OAuth Buttons */}
            <div className="oauth-grid">
              <button
                type="button"
                className="oauth-btn"
                onClick={() => handleOAuth("google")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="oauth-btn"
                onClick={() => handleOAuth("github")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Instant Demo Login Button */}
            <div className="demo-login-box">
              <button
                type="button"
                className="btn-demo-login"
                onClick={handleDemoLogin}
              >
                <span>⚡ Instant Demo Access</span>
                <span className="demo-tag">1-Click Test</span>
              </button>
              <p className="demo-hint">
                Explore the Pro Dashboard instantly with 88 credits without password setup.
              </p>
            </div>

            <div className="auth-footer-terms">
              By continuing, you agree to RevAtlas&apos;s{" "}
              <Link href="/pricing" className="terms-link">Terms of Service</Link> and{" "}
              <Link href="/pricing" className="terms-link">Privacy Policy</Link>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
