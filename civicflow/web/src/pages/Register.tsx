import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        preferred_language: lang,
      });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg = err.message ?? "";
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.error ?? msg);
      } catch {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex bg-white dark:bg-slate-900 transition-colors">
      {/* Left — Illustration */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-purple-50 to-violet-100 dark:from-slate-800 dark:to-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-violet-200/40 dark:bg-violet-900/20 rounded-full -translate-y-1/3 -translate-x-1/3" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full translate-y-1/3 translate-x-1/3" />

        <div className="relative z-10 flex items-center justify-center px-12">
          <img
            src="/RegisterPagePhoto.png"
            alt="Register illustration"
            className="object-contain drop-shadow-2xl"
            style={{ height: "40vh", maxWidth: "100%", animation: "float 3.5s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        {/* Card box around the form */}
        <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-10">
          <img src="/LOGO.png" alt="Nivedan" className="h-10 w-auto object-contain mb-6" />

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-7">
            Create account
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full name</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone number</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Preferred language</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const selected = l.code === lang;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-purple-400"
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm shadow-sm"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
