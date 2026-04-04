import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/LOGO.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav style={{
        position:       'fixed',
        top: 0, left: 0, right: 0,
        height:         64,
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 48px',
        background:     'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom:   '1px solid rgba(27,42,74,0.08)',
        boxShadow:      '0 1px 16px rgba(27,42,74,0.06)',
      }}>
        {/* Logo */}
        <img src={logo} alt="Nivedan" style={{ height: 36, objectFit: 'contain', userSelect: 'none' }} />

        {/* Center links — desktop */}
        <div className="landing-nav-links" style={{ display: 'flex', gap: 36 }}>
          {['Features', 'Languages', 'How it Works', 'Download'].map(link => (
            <a key={link} href="#" className="nav-link" style={{
              fontFamily:     "'Google Sans Flex', system-ui, sans-serif",
              fontSize:        14,
              color:           'rgba(27,42,74,0.65)',
              textDecoration:  'none',
              position:        'relative',
              paddingBottom:   2,
              fontWeight:      500,
            }}>
              {link}
            </a>
          ))}
        </div>

        {/* Right — desktop */}
        <div className="landing-nav-right-btns" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              height:       36,
              padding:      '0 18px',
              borderRadius:  100,
              border:       '1.5px solid rgba(27,42,74,0.35)',
              background:   'transparent',
              color:        '#1B2A4A',
              fontFamily:   "'Google Sans Flex', system-ui, sans-serif",
              fontSize:      14,
              fontWeight:    500,
              cursor:       'pointer',
              transition:   'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1B2A4A'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1B2A4A'; }}
          >
            Sign In
          </button>
          <button
            style={{
              height:       36,
              padding:      '0 18px',
              borderRadius:  100,
              border:       'none',
              background:   '#E8891A',
              color:        '#fff',
              fontFamily:   "'Google Sans Flex', system-ui, sans-serif",
              fontSize:      14,
              fontWeight:    700,
              cursor:       'pointer',
              transition:   'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C9731A'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E8891A'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Download App
          </button>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="landing-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display:    'none',
            background: 'transparent',
            border:     'none',
            color:      '#1B2A4A',
            fontSize:    22,
            cursor:     'pointer',
            lineHeight:  1,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position:   'fixed',
          top: 64, left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          zIndex:      99,
          padding:    '20px 32px',
          display:    'flex',
          flexDirection: 'column',
          gap:         18,
          borderBottom: '1px solid rgba(27,42,74,0.08)',
          boxShadow: '0 8px 24px rgba(27,42,74,0.10)',
        }}>
          {['Features', 'Languages', 'How it Works', 'Download'].map(link => (
            <a
              key={link}
              href="#"
              style={{ fontFamily: "'Google Sans Flex', system-ui, sans-serif", fontSize: 16, color: 'rgba(27,42,74,0.75)', textDecoration: 'none' }}
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid rgba(27,42,74,0.08)', margin: '4px 0' }} />
          <button
            onClick={() => { navigate('/login'); setMenuOpen(false); }}
            style={{
              height: 40, borderRadius: 100, border: '1.5px solid rgba(27,42,74,0.3)',
              background: 'transparent', color: '#1B2A4A',
              fontFamily: "'Google Sans Flex', system-ui, sans-serif", fontSize: 14, cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            style={{
              height: 40, borderRadius: 100, border: 'none',
              background: '#E8891A', color: '#fff',
              fontFamily: "'Google Sans Flex', system-ui, sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Download App
          </button>
        </div>
      )}
    </>
  );
}
