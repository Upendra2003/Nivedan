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
    <div style={s.root}>
      <div style={s.card}>
        <h1 style={s.logo}>CivicFlow</h1>
        <p style={s.tagline}>Your rights, in your language.</p>

        <h2 style={s.title}>Create account</h2>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label style={s.label}>Full name</label>
          <input
            style={s.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ramesh Kumar"
            autoComplete="name"
            required
          />

          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label style={s.label}>Phone number</label>
          <input
            style={s.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
            required
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />

          <label style={s.label}>Preferred language</label>
          <div style={s.langRow}>
            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  style={{
                    ...s.langChip,
                    backgroundColor: selected ? "#7c3aed" : "#f1f5f9",
                    color: selected ? "#fff" : "#64748b",
                    border: `1px solid ${selected ? "#7c3aed" : "#e2e8f0"}`,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>

          <button
            style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "2rem 1rem",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "2rem 2.5rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: "#7c3aed",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: 13,
    color: "#94a3b8",
    margin: "0 0 28px",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 20px",
  },
  error: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    marginBottom: 6,
  },
  input: {
    display: "block",
    width: "100%",
    fontSize: 15,
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    marginBottom: 16,
    boxSizing: "border-box",
  },
  langRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  langChip: {
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "13px",
    marginTop: 4,
    backgroundColor: "#7c3aed",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footer: {
    marginTop: 20,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  link: {
    color: "#7c3aed",
    fontWeight: 600,
    textDecoration: "none",
  },
};
