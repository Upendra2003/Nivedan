import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiZap, FiLock, FiGlobe, FiFileText, FiTool, FiShield,
  FiShoppingBag, FiAlertCircle, FiHome, FiMessageCircle, FiEdit3,
  FiSend, FiBell, FiBarChart2, FiMapPin, FiHeart,
  FiCheckCircle, FiUser, FiArrowRight,
} from 'react-icons/fi';
import { IoLogoApple, IoLogoAndroid } from 'react-icons/io5';
import { LuLandmark, LuBot, LuBadgeCheck } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import Navbar     from '../components/landing/Navbar';
import PhoneScene from '../components/landing/PhoneScene';
import ScrollDots from '../components/landing/ScrollDots';
import logo       from '../assets/LOGO.png';
import '../styles/landing.css';

const FONT_DISPLAY = "'Google Sans Flex', system-ui, sans-serif";
const FONT_UI      = "'Google Sans Flex', system-ui, sans-serif";
const FONT_MONO    = "'JetBrains Mono', 'SF Mono', monospace";

// ── Icon helper ───────────────────────────────────────────────────────────────
function Icon({ as: I, size = 16, color, style }: {
  as: IconType; size?: number; color?: string; style?: React.CSSProperties;
}) {
  return <I size={size} color={color} style={{ flexShrink: 0, ...style }} />;
}

// ── Section data ──────────────────────────────────────────────────────────────
const HERO = {
  h1Lines: ['File Government', 'Complaints.'],
  h1Accent: 'From Your Pocket.',
  body: "No more standing in queues. Nivedan's AI agent files your complaint, fills the forms, submits to government portals and tracks everything. In your language.",
  trust: [
    { icon: FiZap,  label: 'Powered by AI' },
    { icon: FiLock, label: 'Govt. Grade Security' },
    { icon: FiGlobe,label: '8+ Languages' },
  ],
};

const SECTIONS = [
  {
    num: '01', label: 'INTRODUCTION', phoneRight: true,
    h2: ['Your AI-Powered', 'Complaint Officer'],
    body: 'Nivedan is the first AI agent built for Indian citizens to file government complaints without stepping out of their homes.',
    chips: [
      { icon: LuBot,       text: 'AI Agent' },
      { icon: FiFileText,  text: 'Auto Form Fill' },
      { icon: LuLandmark,  text: 'Govt. Portal' },
    ],
  },
  {
    num: '02', label: 'GET STARTED', phoneRight: false,
    h2: ['One Account.', 'Every Complaint.'],
    body: 'Register once with your phone number. Nivedan remembers your details so every future complaint takes seconds — not days.',
    //stats: [{ n: '10k+', sub: 'Users' }, { n: '7', sub: 'Portals' }, { n: '< 5 min', sub: 'To File' }],
  },
  {
    num: '03', label: 'LANGUAGES', phoneRight: true,
    h2: ['Speak Your', 'Language.'],
    body: 'File in Hindi, Telugu, Tamil, Malayalam, Kannada, Marathi, Gujarati, or English. Our AI understands and responds in your mother tongue.',
    langs: [
      { t: 'हिंदी', hi: true }, { t: 'తెలుగు', hi: false },
      { t: 'தமிழ்', hi: false }, { t: 'മലയാളം', hi: true },
      { t: 'ಕನ್ನಡ', hi: false }, { t: 'मराठी', hi: false },
      { t: 'ગુજરાતી', hi: true }, { t: 'English', hi: false },
    ],
  },
  {
    num: '04', label: 'COMPLAINT TYPES', phoneRight: false,
    h2: ['Every Complaint.', 'One App.'],
    body: 'From labour disputes to cyber fraud — all major categories connected to official government portals.',
    categories: [
      { icon: FiTool,         title: 'Labour Issues',    desc: 'Salary disputes, termination, harassment' },
      { icon: FiShield,       title: 'Cyber Crime',      desc: 'Online fraud, scams, identity theft' },
      { icon: FiShoppingBag,  title: 'Consumer Rights',  desc: 'Defective products, service complaints' },
      { icon: FiAlertCircle,  title: 'Police Complaints',desc: 'FIR not registered, misconduct' },
      { icon: FiHome,         title: 'Municipal Issues', desc: 'Roads, water, electricity' },
    ],
  },
  {
    num: '05', label: 'AI AGENT', phoneRight: true,
    h2: ['Just Tell It', 'Your Problem.'],
    body: 'Our AI has a natural conversation with you, fetches the right government form, fills every field — and submits it.',
    steps: [
      { icon: FiMessageCircle, text: 'Describe your problem in your language' },
      { icon: FiFileText,      text: 'AI fetches the correct govt. form' },
      { icon: FiEdit3,         text: 'Form is auto-filled with your details' },
      { icon: FiSend,          text: 'Submitted directly to govt. portal' },
      { icon: FiBell,          text: 'You get notified of every update' },
    ],
  },
  {
    num: '06', label: 'DASHBOARD', phoneRight: false,
    h2: ['Zero Follow-ups.', 'Total Peace.'],
    body: 'Real-time complaint tracking. No more visiting offices, no more unanswered calls.',
    cards: [
      { icon: FiMapPin,    title: 'Real-time tracking',  desc: 'Know exactly where your complaint stands' },
      { icon: FiBell,      title: 'Push notifications',  desc: 'Instant alerts for every portal response' },
      { icon: FiBarChart2, title: 'Case history',        desc: 'All complaints in one organised place' },
    ],
  },
];

// ── Testimonials data ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Ramesh Kumar',
    city: 'Mumbai, Maharashtra',
    quote: 'Filed a salary dispute in Telugu — everything handled in under 5 minutes. Got resolution in 3 days.',
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    city: 'Delhi',
    quote: 'The AI understood my Hindi perfectly even when I typed it in English letters. No confusion at all.',
    stars: 5,
  },
  {
    name: 'Suresh Babu',
    city: 'Chennai, Tamil Nadu',
    quote: 'Never thought filing an FIR complaint could be this easy. No queues, no bribing, just results.',
    stars: 5,
  },
];

const MARQUEE_ITEMS = [
  'Salary Not Paid', 'FIR Not Registered', 'Online Scam', 'Consumer Fraud',
  'Police Misconduct', 'Workplace Harassment', 'Defective Product', 'Municipal Issue',
  'Wrongful Termination', 'Cyber Fraud', 'Labour Dispute', 'Property Dispute',
];

// ── Floating hero cards (both sides, all languages) ──────────────────────────
function FloatCard({ children, className, style }: {
  children: React.ReactNode; className: string; style?: React.CSSProperties;
}) {
  return (
    <div className={`hero-float-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function FloatingHeroCards({ visible }: { visible: boolean }) {
  const base: React.CSSProperties = {
    position: 'fixed', bottom: '12%', zIndex: 6,
    pointerEvents: 'none', display: 'flex', flexDirection: 'column',
    gap: 14, opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };
  const aiDot = (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: 'linear-gradient(135deg,#E8891A,#C9731A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <LuBot size={13} color="#fff" />
    </div>
  );
  const onlineDot = (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0,
      animation: 'badge-pulse 2s ease-in-out infinite',
    }} />
  );

  return (
    <>
      {/* LEFT side — Hindi + Tamil — positioned BELOW the hero text, bottom-left */}
      <div className="hero-float-cards" style={{ ...base, left: '40%', bottom: '22%', alignItems: 'flex-start' }}>
        {/* Hindi notification */}
        <FloatCard className="hero-float-card-b">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {onlineDot}
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(27,42,74,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Nivedan · अभी
            </span>
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: '#1B2A4A', marginBottom: 3 }}>
            ✓ शिकायत दर्ज हुई
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.50)' }}>
            संदर्भ #ND2026-8821 · श्रम आयोग
          </div>
        </FloatCard>

        {/* Tamil AI chat */}
        <FloatCard className="hero-float-card-a" style={{ marginLeft: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {aiDot}
            <div>
              <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, color: '#1B2A4A' }}>Nivedan AI</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#22C55E', letterSpacing: '0.04em' }}>● ONLINE</div>
            </div>
          </div>
          <div style={{ background: 'rgba(232,137,26,0.07)', borderRadius: 10, padding: '8px 12px', fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.75)', lineHeight: 1.55 }}>
            "வணக்கம்! நீங்கள் என்ன சிக்கலை எதிர்கொள்கிறீர்கள்?"
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 10, color: 'rgba(27,42,74,0.35)', marginTop: 8 }}>
            தமிழில் பதிலளிக்கிறது · Sarvam AI
          </div>
        </FloatCard>
      </div>

      {/* RIGHT side — English + Telugu */}
      <div className="hero-float-cards" style={{ ...base, right: '3%', alignItems: 'flex-end' }}>
        {/* English notification */}
        <FloatCard className="hero-float-card-a">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {onlineDot}
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(27,42,74,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Nivedan · Just Now
            </span>
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: '#1B2A4A', marginBottom: 3 }}>
            ✓ Complaint Filed Successfully
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.50)' }}>
            Ref #ND2026-7841 · Labour Commissioner
          </div>
        </FloatCard>

        {/* Telugu AI chat */}
        <FloatCard className="hero-float-card-b" style={{ marginRight: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {aiDot}
            <div>
              <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, color: '#1B2A4A' }}>Nivedan AI</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#22C55E', letterSpacing: '0.04em' }}>● ONLINE</div>
            </div>
          </div>
          <div style={{ background: 'rgba(232,137,26,0.07)', borderRadius: 10, padding: '8px 12px', fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.75)', lineHeight: 1.55 }}>
            "నమస్కారం! మీ జీతం సమస్య గురించి చెప్పండి."
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 10, color: 'rgba(27,42,74,0.35)', marginTop: 8 }}>
            తెలుగులో సమాధానం · Sarvam AI
          </div>
        </FloatCard>
      </div>
    </>
  );
}

// ── Marquee ticker ────────────────────────────────────────────────────────────
function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{
      borderTop: '1px solid rgba(27,42,74,0.07)',
      borderBottom: '1px solid rgba(27,42,74,0.07)',
      background: 'rgba(248,250,252,0.9)',
      padding: '16px 0',
    }}>
      <div className="marquee-wrapper">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section accent panels (fills whitespace on phone side) ───────────────────

function accentCard(content: React.ReactNode, delay = '0s') {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(27,42,74,0.09)', borderRadius: 16,
      padding: '14px 18px', maxWidth: 220,
      boxShadow: '0 6px 28px rgba(27,42,74,0.10)',
      animation: `float-card-a 5s ease-in-out ${delay} infinite`,
    }}>
      {content}
    </div>
  );
}

function SectionAccent({ idx, visible }: { idx: number; visible: boolean }) {
  if (idx === 0 || idx > 6) return null;

  const phoneRight = SECTIONS[idx - 1]?.phoneRight;
  const side       = phoneRight ? 'right' : 'left';
  const pos: React.CSSProperties = side === 'right'
    ? { right: '2.5%' } : { left: '2.5%' };

  const accentContent: React.ReactNode = (() => {
    // if (idx === 1) return (
    //   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    //     {accentCard(<>
    //       <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Citizens Helped</div>
    //       <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 900, color: '#1B2A4A', lineHeight: 1 }}>10,000+</div>
    //       <div style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(27,42,74,0.45)', marginTop: 4 }}>Across 7 govt. portals</div>
    //     </>)}
    //     {accentCard(<>
    //       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    //         <div>
    //           <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Avg. Time</div>
    //           <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 900, color: '#1B2A4A' }}>{'< 5 min'}</div>
    //         </div>
    //         <FiZap size={28} color="rgba(232,137,26,0.25)" />
    //       </div>
    //     </>, '1.5s')}
    //   </div>
    // );
    if (idx === 2) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { step: '01', label: 'Create account', done: true },
          { step: '02', label: 'Pick complaint type', done: true },
          { step: '03', label: 'Talk to AI', done: false },
          { step: '04', label: 'Submit & track', done: false },
        ].map((s, i) => accentCard(
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: s.done ? '#E8891A' : 'rgba(27,42,74,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.done
                ? <FiCheckCircle size={13} color="#fff" />
                : <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: 'rgba(27,42,74,0.40)' }}>{s.step}</span>
              }
            </div>
            <span style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: s.done ? 600 : 400, color: s.done ? '#1B2A4A' : 'rgba(27,42,74,0.50)' }}>
              {s.label}
            </span>
          </div>,
          `${i * 0.4}s`
        ))}
      </div>
    );
    if (idx === 3) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accentCard(<>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>More Languages</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[{ t: 'বাংলা', label: 'Bengali' }, { t: 'मराठी', label: 'Marathi' }, { t: 'ગુજરાતી', label: 'Gujarati' }, { t: 'ਪੰਜਾਬੀ', label: 'Punjabi' }].map(l => (
              <div key={l.t} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(232,137,26,0.07)', border: '1px solid rgba(232,137,26,0.20)', textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, color: '#1B2A4A' }}>{l.t}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: 9, color: 'rgba(27,42,74,0.40)', marginTop: 2 }}>{l.label}</div>
              </div>
            ))}
          </div>
        </>)}
      </div>
    );
    if (idx === 4) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {accentCard(<>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Portal Status</div>
          {['Labour Dept.', 'Cyber Crime Cell', 'Consumer Forum', 'Police HQ'].map((p) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(27,42,74,0.65)' }}>{p}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#22C55E', letterSpacing: '0.04em' }}>● LIVE</span>
            </div>
          ))}
        </>)}
      </div>
    );
    if (idx === 5) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accentCard(<>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Live AI Chat</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: '#1B2A4A', borderRadius: '12px 12px 2px 12px', padding: '7px 11px', maxWidth: 160 }}>
                <span style={{ fontFamily: FONT_UI, fontSize: 11, color: '#fff', lineHeight: 1.4 }}>Mujhe salary nahi mili 2 mahine se</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#E8891A,#C9731A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <LuBot size={10} color="#fff" />
              </div>
              <div style={{ background: 'rgba(232,137,26,0.10)', borderRadius: '12px 12px 12px 2px', padding: '7px 11px', maxWidth: 160 }}>
                <span style={{ fontFamily: FONT_UI, fontSize: 11, color: '#1B2A4A', lineHeight: 1.4 }}>Samajh gaya. Employer ka naam kya hai?</span>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 9, color: 'rgba(27,42,74,0.35)', marginTop: 8, textAlign: 'right' }}>Sarvam AI · Hindi understood</div>
        </>)}
      </div>
    );
    if (idx === 6) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accentCard(<>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#C9731A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Updates</div>
          {[
            { ref: '#ND7819', status: 'Resolved', color: '#22C55E' },
            { ref: '#ND7821', status: 'Under Review', color: '#E8891A' },
            { ref: '#ND7814', status: 'Acknowledged', color: '#3B82F6' },
          ].map(n => (
            <div key={n.ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(27,42,74,0.06)' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(27,42,74,0.55)' }}>{n.ref}</span>
              <span style={{ fontFamily: FONT_UI, fontSize: 10, fontWeight: 600, color: n.color }}>{n.status}</span>
            </div>
          ))}
        </>)}
      </div>
    );
    return null;
  })();

  return (
    <div className="section-accent-panel" style={{
      position: 'fixed', ...pos,
      top: '50%', transform: 'translateY(-50%)',
      zIndex: 6, pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {accentContent}
    </div>
  );
}

// ── Content renderer ──────────────────────────────────────────────────────────
function SectionContent({ idx }: { idx: number }) {
  const navigate = useNavigate();

  if (idx === 0) {
    return (
      <>
        {/* Badge */}
        {/* <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 14px', borderRadius: 100,
          background: 'rgba(232,137,26,0.08)', border: '1px solid rgba(232,137,26,0.35)',
          fontFamily: FONT_MONO, fontSize: 11, color: '#C9731A',
          letterSpacing: '0.03em', marginBottom: 22,
        }}>
          <Icon as={FiGlobe} size={12} color="#C9731A" />
          {HERO.badge}
        </div> */}

        {/* H1 */}
        <h1 style={{
          fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px, 3.6vw, 10px)',
          fontWeight: 900, lineHeight: 1.1, margin: '0 0 18px', color: '#1B2A4A',
        }}>
          {HERO.h1Lines.map(l => <span key={l} style={{ display: 'block' }}>{l}</span>)}
          <span style={{
            display: 'block',
            fontSize: '1.18em',
            background: 'linear-gradient(90deg, #E8891A 0%, #F5A843 60%, #C9731A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{HERO.h1Accent}</span>
        </h1>

        {/* Body */}
        <p style={{
          fontFamily: FONT_UI, fontSize: 15, lineHeight: 1.72,
          color: 'rgba(27,42,74,0.65)', maxWidth: 380, margin: '0 0 22px',
        }}>
          {HERO.body}
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <button onClick={() => navigate('/register')} style={{
            height: 52, padding: '0 28px', borderRadius: 12, border: 'none',
            background: '#E8891A', color: '#fff', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C9731A'; e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E8891A'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon as={IoLogoAndroid} size={18} color="#fff" />
            Download for Free
          </button>
          <button style={{
            height: 52, padding: '0 28px', borderRadius: 12,
            border: '1.5px solid rgba(27,42,74,0.28)', background: 'transparent',
            color: '#1B2A4A', fontFamily: FONT_UI, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(27,42,74,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            See How It Works
          </button>
        </div>

        {/* Trust row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {HERO.trust.map((t, i) => (
            <span key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.45)',
            }}>
              <Icon as={t.icon} size={13} color="rgba(27,42,74,0.40)" />
              {t.label}
            </span>
          ))}
        </div>
      </>
    );
  }

  const sec = SECTIONS[idx - 1];
  return (
    <>
      {/* Section label */}
      <div style={{ marginBottom: 14 }}>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 9, fontWeight: 500,
          color: '#C9731A', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          {sec.num} / {sec.label}
        </span>
      </div>

      {/* H2 */}
      <h2 style={{
        fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px, 3vw, 42px)',
        fontWeight: 900, lineHeight: 1.12, margin: '0 0 16px', color: '#1B2A4A',
      }}>
        {sec.h2.map(l => <span key={l} style={{ display: 'block' }}>{l}</span>)}
      </h2>

      {/* Body */}
      <p style={{
        fontFamily: FONT_UI, fontSize: 14, lineHeight: 1.72,
        color: 'rgba(27,42,74,0.65)', maxWidth: 360, margin: '0 0 18px',
      }}>
        {sec.body}
      </p>

      {/* Chips */}
      {'chips' in sec && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(sec as any).chips.map((c: { icon: IconType; text: string }) => (
            <span key={c.text} className="feature-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon as={c.icon} size={12} color="#C9731A" />
              {c.text}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      {'stats' in sec && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(sec as any).stats.map((s: any, i: number) => (
            <div key={s.sub} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, color: '#E8891A' }}>{s.n}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.50)', marginTop: 4 }}>{s.sub}</div>
              </div>
              {i < 2 && <div className="stat-divider" />}
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {'langs' in sec && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 300 }}>
          {(sec as any).langs.map((l: any) => (
            <div key={l.t} style={{
              padding: '9px 16px', borderRadius: 100, textAlign: 'center',
              fontFamily: FONT_UI, fontSize: 14, fontWeight: l.hi ? 600 : 400,
              background: l.hi ? '#E8891A' : 'rgba(27,42,74,0.05)',
              color:      l.hi ? '#fff'    : 'rgba(27,42,74,0.75)',
              border:     l.hi ? 'none'    : '1px solid rgba(27,42,74,0.12)',
            }}>{l.t}</div>
          ))}
        </div>
      )}

      {/* Categories */}
      {'categories' in sec && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 400 }}>
          {(sec as any).categories.map((c: { icon: IconType; title: string; desc: string }) => (
            <div key={c.title} className="category-grid-card">
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(232,137,26,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 6,
              }}>
                <Icon as={c.icon} size={16} color="#E8891A" />
              </div>
              <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>{c.title}</div>
              <div style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(27,42,74,0.48)', lineHeight: 1.4 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      {'steps' in sec && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 13, top: 24, bottom: 24, width: 1, borderLeft: '2px dashed rgba(232,137,26,0.25)' }} />
          {(sec as any).steps.map((step: { icon: IconType; text: string }, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', position: 'relative' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#E8891A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, zIndex: 1,
              }}>
                <Icon as={step.icon} size={13} color="#fff" />
              </div>
              <span style={{ fontFamily: FONT_UI, fontSize: 14, color: 'rgba(27,42,74,0.78)' }}>{step.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cards */}
      {'cards' in sec && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(sec as any).cards.map((card: { icon: IconType; title: string; desc: string }) => (
            <div key={card.title} className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon as={card.icon} size={15} color="#E8891A" />
                <div style={{ fontFamily: FONT_UI, fontSize: 14, fontWeight: 600, color: '#1B2A4A' }}>{card.title}</div>
              </div>
              <div style={{ fontFamily: FONT_UI, fontSize: 13, color: 'rgba(27,42,74,0.55)' }}>{card.desc}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
// const DARK_STATS = [
//   { n: '10k+',   label: 'Citizens Helped' },
//   { n: '4.8★',   label: 'App Rating' },
//   { n: '< 5 min', label: 'To File' },
//   { n: '8+',     label: 'Languages' },
// ];

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="final-cta-dark" style={{ padding: '100px 64px 80px', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 11, color: '#E8891A',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '7px 20px', border: '1px solid rgba(232,137,26,0.40)',
            borderRadius: 100, background: 'rgba(232,137,26,0.08)',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            <LuBadgeCheck size={12} color="#E8891A" />
            Free to Download · No Sign-up Fee
          </span>
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontSize: 'clamp(44px,7vw,50px)',
          fontWeight: 900, lineHeight: 1.08, marginBottom: 22,
          color: '#FFFFFF', textAlign: 'center',
        }}>
          Your Voice.<br />
          <span style={{ color: '#E8891A' }}>Finally Heard.</span>
        </h2>
        <p style={{
          fontFamily: FONT_UI, fontSize: 18, color: 'rgba(255,255,255,0.55)',
          maxWidth: 520, lineHeight: 1.7, marginBottom: 52,
          textAlign: 'center', margin: '0 auto 52px',
        }}>
          Join thousands of Indian citizens filing complaints the modern way.
          No queues. No confusion. Just results.
        </p>

        {/* Stats strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 0, flexWrap: 'wrap', marginBottom: 64,
        }}>
          {/* {DARK_STATS.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: '0 36px' }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: '#E8891A' }}>{s.n}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.label}</div>
              </div>
              {i < DARK_STATS.length - 1 && <div className="dark-stat-divider" />}
            </div>
          ))} */}
        </div>

        {/* Testimonials */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20, maxWidth: 920, margin: '0 auto 60px',
        }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p style={{
                fontFamily: FONT_UI, fontSize: 14, lineHeight: 1.65,
                color: 'rgba(255,255,255,0.80)', marginBottom: 20,
                fontStyle: 'italic',
              }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(232,137,26,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FiUser size={16} color="#E8891A" />
                </div>
                <div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{t.name}</div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => navigate('/register')} style={{
            height: 58, minWidth: 220, padding: '0 36px', borderRadius: 14,
            border: 'none', background: '#E8891A', color: '#fff',
            fontFamily: FONT_UI, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 32px rgba(232,137,26,0.35)',
            transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C9731A'; e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(232,137,26,0.50)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E8891A'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(232,137,26,0.35)'; }}
          >
            <Icon as={IoLogoAndroid} size={20} color="#fff" />
            Download for Android
            <Icon as={FiArrowRight} size={16} color="#fff" />
          </button>
          <button style={{
            height: 58, minWidth: 220, padding: '0 36px', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.20)', background: 'transparent',
            color: '#FFFFFF', fontFamily: FONT_UI, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'; }}
          >
            <Icon as={IoLogoApple} size={20} color="#fff" />
            Download for iOS
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontFamily: FONT_UI, fontSize: 12,
          color: 'rgba(255,255,255,0.28)',
        }}>
          100% free · No ads
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: '#0A1628', padding: '60px 64px 40px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 48, marginBottom: 40 }}>
        <div>
          <img src={logo} alt="Nivedan" style={{ height: 36, marginBottom: 14, objectFit: 'contain' }} />
          <div style={{ fontFamily: FONT_UI, fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 1.6 }}>
            Complaints. From your pocket.
            <br /><br />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Made with <Icon as={FiHeart} size={13} color="#E8891A" style={{ margin: '0 2px' }} /> for Indian citizens.
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Links</div>
          {['Features', 'Languages', 'How It Works', 'Privacy Policy', 'Terms of Service'].map(l => (
            <div key={l} style={{ marginBottom: 10 }}>
              <a href="#" style={{ fontFamily: FONT_UI, fontSize: 14, color: 'rgba(255,255,255,0.40)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#E8891A')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
              >{l}</a>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Available on</div>
          {[
            { label: 'Google Play', icon: IoLogoAndroid },
            { label: 'App Store',   icon: IoLogoApple },
          ].map(s => (
            <button key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: 160, height: 40, marginBottom: 10,
              borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.18)',
              background: 'transparent', color: 'rgba(255,255,255,0.60)',
              fontFamily: FONT_UI, fontSize: 13, cursor: 'pointer', paddingLeft: 16,
              transition: 'background 0.2s, color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
            >
              <Icon as={s.icon} size={15} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 Nivedan. All rights reserved.</span>
        <span style={{ fontFamily: FONT_UI, fontSize: 12, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 5 }}>
          Built in India
          <Icon as={FiGlobe} size={12} color="rgba(255,255,255,0.25)" />
        </span>
      </div>
    </footer>
  );
}

// ── Window width hook ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

// ── Mobile layout (single-column) ─────────────────────────────────────────────
function MobileLanding() {
  const navigate = useNavigate();

  return (
    <div className="landing-page mobile-layout">
      <Navbar />

      {/* Phone hero block */}
      <div style={{ paddingTop: 64, display: 'flex', flexDirection: 'column' }}>

        {/* 3D phone — full width, fixed height */}
        <div style={{ height: 340, width: '100%', position: 'relative', flexShrink: 0 }}>
          <PhoneScene section={0} center />
        </div>

        {/* Hero text */}
        <div style={{ padding: '32px 24px 40px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', borderRadius: 100,
            background: 'rgba(232,137,26,0.08)', border: '1px solid rgba(232,137,26,0.35)',
            fontFamily: FONT_MONO, fontSize: 10, color: '#C9731A',
            letterSpacing: '0.03em', marginBottom: 18,
          }}>
            <Icon as={FiGlobe} size={11} color="#C9731A" />
            Available in 8+ Indian Languages
          </div>

          {/* H1 */}
          <h1 style={{
            fontFamily: FONT_DISPLAY, fontSize: 'clamp(26px, 7vw, 40px)',
            fontWeight: 900, lineHeight: 1.12, margin: '0 0 6px', color: '#1B2A4A',
          }}>
            File Government Complaints.
          </h1>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px, 8vw, 44px)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: 18,
            background: 'linear-gradient(90deg, #E8891A 0%, #F5A843 60%, #C9731A 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            From Your Pocket.
          </div>

          {/* Body */}
          <p style={{
            fontFamily: FONT_UI, fontSize: 15, lineHeight: 1.7,
            color: 'rgba(27,42,74,0.65)', maxWidth: 480,
            margin: '0 auto 24px',
          }}>
            {HERO.body}
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button onClick={() => navigate('/register')} style={{
              height: 50, width: '100%', maxWidth: 320, borderRadius: 12,
              border: 'none', background: '#E8891A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              <Icon as={IoLogoAndroid} size={18} color="#fff" />
              Download for Free
            </button>
            <button onClick={() => navigate('/login')} style={{
              height: 50, width: '100%', maxWidth: 320, borderRadius: 12,
              border: '1.5px solid rgba(27,42,74,0.25)', background: 'transparent',
              color: '#1B2A4A', fontFamily: FONT_UI, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Sign In
            </button>
          </div>

          {/* Trust row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
            {HERO.trust.map((t, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT_UI, fontSize: 12, color: 'rgba(27,42,74,0.45)' }}>
                <Icon as={t.icon} size={12} color="rgba(27,42,74,0.35)" />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee */}
      <MarqueeStrip />

      {/* Sections — stacked column */}
      {SECTIONS.map((sec, i) => (
        <div key={sec.num} style={{
          padding: '48px 24px',
          borderTop: '1px solid rgba(27,42,74,0.07)',
          background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
        }}>
          {/* Section label */}
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: '#C9731A',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
          }}>
            {sec.num} / {sec.label}
          </div>

          {/* H2 */}
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: 'clamp(22px, 6vw, 32px)',
            fontWeight: 900, lineHeight: 1.15, color: '#1B2A4A', margin: '0 0 14px',
          }}>
            {sec.h2.join(' ')}
          </h2>

          {/* Body */}
          <p style={{
            fontFamily: FONT_UI, fontSize: 14, lineHeight: 1.72,
            color: 'rgba(27,42,74,0.65)', margin: '0 0 22px',
          }}>
            {sec.body}
          </p>

          {/* Chips */}
          {'chips' in sec && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(sec as any).chips.map((c: { icon: IconType; text: string }) => (
                <span key={c.text} className="feature-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon as={c.icon} size={12} color="#C9731A" />
                  {c.text}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          {'stats' in sec && (
            <div style={{ display: 'flex', gap: 0 }}>
              {(sec as any).stats.map((s: any, j: number) => (
                <div key={s.sub} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, color: '#E8891A' }}>{s.n}</div>
                    <div style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(27,42,74,0.50)', marginTop: 4 }}>{s.sub}</div>
                  </div>
                  {j < 2 && <div className="stat-divider" />}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {'langs' in sec && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(sec as any).langs.map((l: any) => (
                <div key={l.t} style={{
                  padding: '8px 4px', borderRadius: 100, textAlign: 'center',
                  fontFamily: FONT_UI, fontSize: 13, fontWeight: l.hi ? 600 : 400,
                  background: l.hi ? '#E8891A' : 'rgba(27,42,74,0.05)',
                  color: l.hi ? '#fff' : 'rgba(27,42,74,0.75)',
                  border: l.hi ? 'none' : '1px solid rgba(27,42,74,0.12)',
                }}>{l.t}</div>
              ))}
            </div>
          )}

          {/* Categories */}
          {'categories' in sec && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(sec as any).categories.map((c: { icon: IconType; title: string; desc: string }) => (
                <div key={c.title} className="category-grid-card">
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(232,137,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    <Icon as={c.icon} size={15} color="#E8891A" />
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 700, color: '#1B2A4A' }}>{c.title}</div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 11, color: 'rgba(27,42,74,0.48)', lineHeight: 1.4 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Steps */}
          {'steps' in sec && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 13, top: 24, bottom: 24, width: 1, borderLeft: '2px dashed rgba(232,137,26,0.25)' }} />
              {(sec as any).steps.map((step: { icon: IconType; text: string }, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', position: 'relative' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8891A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    <Icon as={step.icon} size={13} color="#fff" />
                  </div>
                  <span style={{ fontFamily: FONT_UI, fontSize: 14, color: 'rgba(27,42,74,0.78)' }}>{step.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          {'cards' in sec && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(sec as any).cards.map((card: { icon: IconType; title: string; desc: string }) => (
                <div key={card.title} className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon as={card.icon} size={15} color="#E8891A" />
                    <div style={{ fontFamily: FONT_UI, fontSize: 14, fontWeight: 600, color: '#1B2A4A' }}>{card.title}</div>
                  </div>
                  <div style={{ fontFamily: FONT_UI, fontSize: 13, color: 'rgba(27,42,74,0.55)' }}>{card.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <FinalCTA />
      <Footer />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TOTAL_SECTIONS = 7;

// ── Desktop landing (scroll-driven 3D fixed layout) ──────────────────────────
function DesktopLanding() {
  const [section,     setSection]     = useState(0);
  const [displayIdx,  setDisplayIdx]  = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight * TOTAL_SECTIONS;
      const p   = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      const s   = Math.min(Math.floor(p * TOTAL_SECTIONS), TOTAL_SECTIONS - 1);
      setSection(prev => prev !== s ? s : prev);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (section === displayIdx) return;
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    setFadeOpacity(0);
    fadeTimer.current = setTimeout(() => {
      setDisplayIdx(section);
      setFadeOpacity(1);
    }, 260);
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); };
  }, [section]);

  const scrollToSection = (i: number) => {
    window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });
  };

  const phoneRight = displayIdx === 0 || SECTIONS[displayIdx - 1]?.phoneRight;
  const textLeft   = phoneRight;

  return (
    <div className="landing-page">
      <Navbar />

      {/* Fixed 3-D phone canvas — pointer events enabled for drag interaction.
          Wheel events forwarded to window so page scroll still works. */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1 }}
        onWheel={e => window.scrollBy({ top: e.deltaY, behavior: 'auto' })}
      >
        <PhoneScene section={section} />
      </div>

      {/* Fixed content overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 5,
        display: 'flex', alignItems: 'center',
        pointerEvents: 'none', paddingTop: 64,
      }}>
        <div style={{
          position:    'absolute',
          left:        textLeft ? '5%' : 'auto',
          right:      !textLeft ? '5%' : 'auto',
          width:       'min(400px, 40%)',
          opacity:     fadeOpacity,
          transform:   `translateY(${fadeOpacity === 1 ? 0 : 12}px)`,
          transition:  'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: 'auto',
        }}>
          <SectionContent idx={displayIdx} />
        </div>
      </div>

      {/* Scroll dots */}
      <ScrollDots
        active={Math.max(0, section - 1)}
        onDotClick={i => scrollToSection(i + 1)}
      />

      {/* Floating hero cards — all 4 (both sides), visible only on section 0 */}
      <FloatingHeroCards visible={section === 0} />

      {/* Section accent panels — fills whitespace on phone side for sections 1–6 */}
      <SectionAccent idx={displayIdx} visible={displayIdx > 0} />

      {/* Marquee ticker fixed at bottom — visible on hero section */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 7,
        pointerEvents: 'none',
        opacity: section === 0 ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <MarqueeStrip />
      </div>

      {/* 700vh scroll spacer */}
      <div style={{ height: `${TOTAL_SECTIONS * 100}vh` }} aria-hidden="true" />

      {/* Below-fold: CTA + Footer */}
      <div style={{ position: 'relative', zIndex: 15, background: '#fff' }}>
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}

// ── Root router — picks mobile or desktop layout ──────────────────────────────
export default function Landing() {
  const w = useWindowWidth();
  return w < 960 ? <MobileLanding /> : <DesktopLanding />;
}
