import { useNavigate } from "react-router-dom";

interface Props { scrollProgress: number }

/** Linear fade helper: fade in [inAt→fullAt], hold, fade out [outAt→goneAt] */
function fade(p: number, inAt: number, fullAt: number, outAt: number, goneAt: number) {
  if (p < inAt)    return 0;
  if (p < fullAt)  return (p - inAt) / (fullAt - inAt);
  if (p <= outAt)  return 1;
  if (p < goneAt)  return 1 - (p - outAt) / (goneAt - outAt);
  return 0;
}

export default function Overlay({ scrollProgress }: Props) {
  const navigate = useNavigate();
  const p = scrollProgress;

  // Zone 1 narration texts
  const narr1 = fade(p, 0.04, 0.09, 0.15, 0.21);
  const narr2 = fade(p, 0.18, 0.23, 0.28, 0.33);

  // Section 1: right-side panel (3D phone is on left)
  const s1 = fade(p, 0.47, 0.52, 0.59, 0.64);

  // Section 2: left-side panel (3D phone is on right)
  const s2 = fade(p, 0.63, 0.67, 0.73, 0.77);

  // Section 3: full-width "anywhere, any time"
  const s3 = fade(p, 0.75, 0.79, 0.84, 0.88);

  // Section 4: full-width "track from pocket"
  const s4 = fade(p, 0.85, 0.89, 0.94, 0.98);

  // CTA: "Login to your dashboard"
  const cta = fade(p, 0.92, 0.96, 1.05, 1.1);

  // Scroll pill: hide when CTA appears
  const pillOpacity = p > 0.88 ? 0 : 1;

  const cardStyle: React.CSSProperties = {
    background: "rgba(8,18,38,0.84)",
    border: "1px solid rgba(232,137,26,0.36)",
    borderRadius: 20,
    padding: "28px 32px",
    backdropFilter: "blur(14px)",
  };

  const labelStyle: React.CSSProperties = {
    margin: "0 0 8px",
    fontFamily: "system-ui,sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "#E8891A",
    textTransform: "uppercase",
  };

  const headingStyle: React.CSSProperties = {
    margin: "0 0 14px",
    fontFamily: "system-ui,sans-serif",
    fontWeight: 800,
    color: "#ffffff",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily: "system-ui,sans-serif",
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.65,
    margin: 0,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}>

      {/* ── Zone 1: Narration 1 — "Fed up with documents" ─────────────── */}
      {narr1 > 0 && (
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: `translateX(-50%) translateY(${(1-narr1)*18}px)`,
          textAlign: "center",
          opacity: narr1,
          maxWidth: 680,
          width: "90%",
        }}>
          <p style={{
            margin: 0,
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(17px,2.2vw,26px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.94)",
            textShadow: "0 2px 20px rgba(0,0,0,0.85)",
            letterSpacing: "0.01em",
            lineHeight: 1.4,
          }}>
            Fed up with messy documents and complaints?
          </p>
        </div>
      )}

      {/* ── Zone 1: Narration 2 — "Fed up with tracking" ──────────────── */}
      {narr2 > 0 && (
        <div style={{
          position: "absolute",
          bottom: "20%",
          left: "50%",
          transform: `translateX(-50%) translateY(${(1-narr2)*18}px)`,
          textAlign: "center",
          opacity: narr2,
          maxWidth: 700,
          width: "90%",
        }}>
          <p style={{
            margin: 0,
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(17px,2.2vw,26px)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.94)",
            textShadow: "0 2px 20px rgba(0,0,0,0.85)",
            letterSpacing: "0.01em",
            lineHeight: 1.4,
          }}>
            Fed up with tracking the status of your complaints at every government office?
          </p>
        </div>
      )}

      {/* ── Section 1: Right panel — phone is on 3D left ───────────────── */}
      {s1 > 0 && (
        <div style={{
          position: "absolute",
          right: "5%",
          top: "50%",
          transform: `translateY(-50%) translateX(${(1-s1)*50}px)`,
          width: "min(420px, 40vw)",
          opacity: s1,
          pointerEvents: s1 > 0.3 ? "auto" : "none",
        }}>
          <div style={cardStyle}>
            <p style={labelStyle}>Introducing Nivedan</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(22px,2.5vw,32px)" }}>
              File complaints<br />the smart way
            </h2>
            <p style={{ ...bodyStyle, marginBottom: 20 }}>
              AI-powered conversations guide you step-by-step. No paperwork, no office queues.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {[
                { icon: "🤖", text: "AI agent understands your problem" },
                { icon: "📋", text: "Auto-fills government forms for you" },
                { icon: "✅", text: "Submits to official portals instantly" },
              ].map(item => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontFamily: "system-ui,sans-serif", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Left panel — phone is on 3D right ───────────────── */}
      {s2 > 0 && (
        <div style={{
          position: "absolute",
          left: "5%",
          top: "50%",
          transform: `translateY(-50%) translateX(${(1-s2)*-50}px)`,
          width: "min(400px, 40vw)",
          opacity: s2,
          pointerEvents: s2 > 0.3 ? "auto" : "none",
        }}>
          <div style={cardStyle}>
            <p style={labelStyle}>Your language, your voice</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(22px,2.5vw,32px)" }}>
              In your own language
            </h2>
            <p style={{ ...bodyStyle, marginBottom: 18 }}>
              Speak or type in any language you're comfortable with. Nivedan understands you perfectly.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["हिंदी", "Tamil", "తెలుగు", "ಕನ್ನಡ", "മലയ", "English"].map(lang => (
                <span key={lang} style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontFamily: "system-ui,sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  background: "rgba(232,137,26,0.18)",
                  border: "1px solid rgba(232,137,26,0.5)",
                }}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: "File complaint from anywhere" ───────────────────── */}
      {s3 > 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%,-50%) scale(${0.88 + s3 * 0.12})`,
          textAlign: "center",
          opacity: s3,
          width: "90%",
          maxWidth: 820,
        }}>
          <div style={{ fontSize: "clamp(48px,7vw,80px)", marginBottom: 16 }}>📍</div>
          <h2 style={{
            margin: "0 0 18px",
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(28px,4.5vw,60px)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 40px rgba(0,0,0,0.65)",
          }}>
            File complaint from<br />
            <span style={{ color: "#E8891A" }}>anywhere at any time</span>
          </h2>
          <p style={{
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(15px,1.8vw,20px)",
            color: "rgba(255,255,255,0.68)",
            lineHeight: 1.6,
            margin: 0,
          }}>
            From your phone, at home, at work — 24/7 access to official government channels.
          </p>
        </div>
      )}

      {/* ── Section 4: "Track from your pocket" ─────────────────────────── */}
      {s4 > 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%,-50%) scale(${0.88 + s4 * 0.12})`,
          textAlign: "center",
          opacity: s4,
          width: "90%",
          maxWidth: 820,
        }}>
          <div style={{ fontSize: "clamp(48px,7vw,80px)", marginBottom: 16 }}>📊</div>
          <h2 style={{
            margin: "0 0 18px",
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(28px,4.5vw,60px)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 40px rgba(0,0,0,0.65)",
          }}>
            Track your complaints<br />
            <span style={{ color: "#E8891A" }}>from your pocket</span>
          </h2>
          <p style={{
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(15px,1.8vw,20px)",
            color: "rgba(255,255,255,0.68)",
            lineHeight: 1.6,
            margin: 0,
          }}>
            No waiting at government offices. Real-time status updates, straight to your phone.
          </p>
        </div>
      )}

      {/* ── CTA: Login to dashboard ─────────────────────────────────────── */}
      {cta > 0 && (
        <div style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: `translateX(-50%) translateY(${(1-cta)*30}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: cta,
          pointerEvents: cta > 0.3 ? "auto" : "none",
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: "system-ui,sans-serif",
            fontSize: "clamp(22px,3vw,40px)",
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            textShadow: "0 2px 24px rgba(0,0,0,0.8)",
          }}>
            Login to your dashboard
          </h2>

          {/* feature pills */}
          <div style={{ display: "flex", gap: 10 }}>
            {["6 Languages", "AI-Powered", "Real Portals"].map(label => (
              <div key={label} style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "system-ui,sans-serif",
                letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(27,42,74,0.7)",
                border: "1px solid rgba(232,137,26,0.4)",
                backdropFilter: "blur(6px)",
              }}>{label}</div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "16px 56px",
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "system-ui,sans-serif",
              letterSpacing: "0.06em",
              color: "#fff",
              background: "linear-gradient(135deg,#f0a030 0%,#E8891A 50%,#c86810 100%)",
              border: "none",
              borderRadius: 50,
              cursor: "pointer",
              boxShadow: "0 6px 32px rgba(232,137,26,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 40px rgba(232,137,26,0.7), 0 0 0 1px rgba(255,255,255,0.2) inset";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 32px rgba(232,137,26,0.55), 0 0 0 1px rgba(255,255,255,0.15) inset";
            }}
          >
            Get Started →
          </button>

          <p style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            fontFamily: "system-ui,sans-serif",
            letterSpacing: "0.04em",
            margin: 0,
            textAlign: "center",
          }}>
            File complaints in your language. Free, fast, official.
          </p>
        </div>
      )}

      {/* Scroll progress pill */}
      <div style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        color: "#E8891A",
        fontFamily: "monospace",
        fontSize: 12,
        background: "rgba(27,42,74,0.8)",
        padding: "4px 12px",
        borderRadius: 20,
        border: "1px solid #E8891A33",
        pointerEvents: "none",
        opacity: pillOpacity,
        transition: "opacity 0.4s",
      }}>
        scroll {Math.round(p * 100)}%
      </div>
    </div>
  );
}
