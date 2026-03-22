import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SunIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      try { setError(JSON.parse(err.message).error ?? err.message); }
      catch { setError(err.message || "Login failed. Please try again."); }
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/register");
  };

  return (
    <div className="auth-page flex bg-white dark:bg-slate-900 transition-colors">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Left — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-slate-50 dark:bg-slate-900">
        {/* Card box around the form */}
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-10">
          <img src="/LOGO.png" alt="Nivedan" className="h-10 w-auto object-contain mb-6" />

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-7">
            Welcome back
          </h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <a href="/register" onClick={goToRegister} className="text-purple-600 font-semibold hover:underline cursor-pointer">
              Create one
            </a>
          </p>
        </div>
      </div>

      {/* Right — Illustration */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/40 dark:bg-purple-900/20 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 flex items-center justify-center px-12">
          <img
            src="/LoginPagePhoto.png"
            alt="CivicFlow illustration"
            className="object-contain drop-shadow-2xl"
            style={{ height: "40vh", maxWidth: "100%", animation: "float 3.5s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
