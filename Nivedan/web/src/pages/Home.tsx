import { useNavigate } from "react-router-dom";

const SAFFRON = "#E8891A";
const NAVY    = "#1B2A4A";

const features = [
  { icon: "🤖", title: "AI-Powered Agent",    desc: "Conversational AI guides you through filing step by step — no forms to figure out." },
  { icon: "🌐", title: "6 Indian Languages",  desc: "Hindi, Tamil, Telugu, Kannada, Malayalam, and English — speak in your own language." },
  { icon: "📋", title: "Auto-Fills Forms",    desc: "Government forms are fetched and filled automatically based on your conversation." },
  { icon: "✅", title: "Official Portals",    desc: "Complaints are submitted directly to real government portals, not just stored locally." },
  { icon: "📊", title: "Real-Time Tracking",  desc: "Get instant updates on your case status — no more waiting at government offices." },
  { icon: "🔒", title: "Secure & Private",    desc: "Your data is encrypted and never shared beyond the official complaint process." },
];

const steps = [
  { n: "1", label: "Pick a category",   sub: "Labour, Consumer, Police & more" },
  { n: "2", label: "Chat with the AI",  sub: "Describe your problem naturally" },
  { n: "3", label: "Review your form",  sub: "AI fills the official government form" },
  { n: "4", label: "Submit & track",    sub: "One tap — we handle the rest" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#0d1521", color: "#fff", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 64,
        background: "rgba(13,21,33,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(232,137,26,0.15)",
      }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: SAFFRON, letterSpacing: "0.04em" }}>
          NIVEDAN
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "8px 22px", borderRadius: 8, border: `1px solid rgba(232,137,26,0.4)`,
              background: "transparent", color: "rgba(255,255,255,0.85)", cursor: "pointer",
              fontSize: 14, fontWeight: 600,
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "8px 22px", borderRadius: 8, border: "none",
              background: SAFFRON, color: "#fff", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{
        textAlign: "center", padding: "100px 24px 80px",
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(27,42,74,0.7) 0%, transparent 70%)`,
      }}>
        <div style={{
          display: "inline-block", marginBottom: 20,
          padding: "5px 18px", borderRadius: 20,
          background: "rgba(232,137,26,0.15)", border: `1px solid rgba(232,137,26,0.4)`,
          fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: SAFFRON,
          textTransform: "uppercase",
        }}>
          India's AI Civic Assistant
        </div>

        <h1 style={{
          fontSize: "clamp(36px,7vw,80px)", fontWeight: 900,
          lineHeight: 1.1, letterSpacing: "-0.03em",
          margin: "0 auto 20px", maxWidth: 800,
        }}>
          Government.<br />
          <span style={{ color: SAFFRON }}>From your pocket.</span>
        </h1>

        <p style={{
          fontSize: "clamp(16px,2vw,20px)", color: "rgba(255,255,255,0.65)",
          lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px",
        }}>
          File complaints in your language, auto-fill official forms with AI, and track every case in real time — no office visits needed.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "16px 48px", fontSize: 17, fontWeight: 800,
              borderRadius: 50, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, #f0a030, ${SAFFRON}, #c86810)`,
              color: "#fff",
              boxShadow: "0 6px 32px rgba(232,137,26,0.45)",
            }}
          >
            File a Complaint Free →
          </button>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "16px 36px", fontSize: 17, fontWeight: 600,
              borderRadius: 50, cursor: "pointer",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#fff",
            }}
          >
            Login to Dashboard
          </button>
        </div>

        {/* Pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
          {["Free to use", "6 Languages", "Real portals", "AI-powered"].map(t => (
            <span key={t} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, marginBottom: 12 }}>
          How it works
        </h2>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", marginBottom: 52 }}>
          From problem to official complaint in under 5 minutes.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 24 }}>
          {steps.map(s => (
            <div key={s.n} style={{
              background: "rgba(27,42,74,0.4)", border: "1px solid rgba(232,137,26,0.2)",
              borderRadius: 16, padding: "28px 20px", textAlign: "center",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px",
                background: SAFFRON, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, color: "#fff",
              }}>{s.n}</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        background: "rgba(27,42,74,0.15)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(24px,4vw,38px)", fontWeight: 800, marginBottom: 52 }}>
            Everything you need
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: "rgba(13,21,33,0.7)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "28px 24px",
                transition: "border-color 0.2s",
              }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section style={{
        textAlign: "center", padding: "100px 24px",
        background: `radial-gradient(ellipse 60% 80% at 50% 50%, rgba(232,137,26,0.12) 0%, transparent 70%)`,
      }}>
        <h2 style={{ fontSize: "clamp(26px,5vw,52px)", fontWeight: 900, marginBottom: 16 }}>
          Ready to file your complaint?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 36, fontSize: 17 }}>
          Free, fast, and officially submitted. No paperwork required.
        </p>
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "18px 56px", fontSize: 18, fontWeight: 800,
            borderRadius: 50, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, #f0a030, ${SAFFRON}, #c86810)`,
            color: "#fff",
            boxShadow: "0 8px 36px rgba(232,137,26,0.5)",
          }}
        >
          Get Started for Free →
        </button>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        textAlign: "center", padding: "28px 24px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        color: "rgba(255,255,255,0.35)", fontSize: 13,
      }}>
        © 2025 Nivedan · Built for Indian citizens
      </footer>
    </div>
  );
}
