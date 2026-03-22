import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Layout from "../components/Layout";
import { api } from "../services/api";

// ── Icons ──────────────────────────────────────────────────────────────────────

const IcoLang    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>;
const IcoId      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IcoMail    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IcoShield  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoInfo    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoSun     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>;
const IcoMoon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
const IcoLogout  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [lang, setLangState] = useState(user?.preferred_language ?? "en");
  const [langChanging, setLangChanging] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("");

  const handleLangSelect = async (code: string) => {
    if (code === lang || langChanging) return;
    setLangChanging(true);
    setLangState(code);
    try {
      await api.patch("/auth/me", { preferred_language: code });
    } catch {
      // non-critical
    } finally {
      setLangChanging(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Profile</h1>

        {/* ── Hero card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl p-8 mb-6 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(to right, #5B4EC9, #9B72E8)" }}>
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(255,255,255,0.22)" }}>
            <span className="text-[26px] font-extrabold text-white leading-none">{initials}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.72)" }}>{user.email}</p>
          <div className="px-5 py-1.5 rounded-full" style={{ border: "1.5px solid rgba(255,255,255,0.55)" }}>
            <span className="text-xs font-bold text-white tracking-widest">TEAM NIVEDAN</span>
          </div>
        </div>

        {/* ── Language ───────────────────────────────────────────────── */}
        <SectionLabel>Preferred Language</SectionLabel>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => handleLangSelect(l.code)}
                  disabled={langChanging}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    selected
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-purple-400"
                  }`}
                >
                  {l.label}
                  {selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Account info ───────────────────────────────────────────── */}
        <SectionLabel>Account Info</SectionLabel>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-5">
          <InfoRow icon={<IcoMail />}   label="Email"    value={user.email} />
          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />
          <InfoRow icon={<IcoLang />}   label="Language" value={LANGUAGES.find(l => l.code === lang)?.label ?? lang} />
          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />
          <InfoRow icon={<IcoId />}     label="Account ID" value={user.id?.slice(-8).toUpperCase() ?? "—"} />
        </div>

        {/* ── App settings ───────────────────────────────────────────── */}
        <SectionLabel>App</SectionLabel>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mb-5">
          {/* Theme toggle */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              {dark ? <IcoMoon /> : <IcoSun />}
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-medium">Appearance</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dark ? "Dark mode" : "Light mode"}</div>
            </div>
            <button
              onClick={toggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${dark ? "bg-purple-600" : "bg-slate-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />
          <InfoRow icon={<IcoShield />} label="Version"  value="1.0.0" />
          <div className="h-px bg-slate-100 dark:bg-slate-700 mx-4" />
          <InfoRow icon={<IcoInfo />}   label="About"    value="Nivedan — Your rights, in your language." />
        </div>

        {/* ── Sign out ───────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <IcoLogout />
          Sign out
        </button>

        <p className="text-center text-xs text-slate-300 dark:text-slate-600 mt-6">
          © 2026 Nivedan. All rights reserved.
        </p>
      </div>
    </Layout>
  );
}
