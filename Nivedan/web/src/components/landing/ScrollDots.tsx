import { useState } from 'react';

const SECTIONS = [
  'Introduction',
  'Get Started',
  'Languages',
  'Complaint Types',
  'AI Agent',
  'Dashboard',
];

interface Props {
  active: number;
  onDotClick: (index: number) => void;
}

export default function ScrollDots({ active, onDotClick }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="scroll-dots">
      {SECTIONS.map((label, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            {hovered === i && (
              <div style={{
                position:   'absolute',
                right:       18,
                whiteSpace: 'nowrap',
                background: 'rgba(27,42,74,0.92)',
                border:     '1px solid rgba(232,137,26,0.3)',
                borderRadius: 8,
                padding:    '5px 12px',
                fontFamily: "'Google Sans Flex', system-ui, sans-serif",
                fontSize:    12,
                color:      'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'none',
              }}>
                {label}
              </div>
            )}

            {/* Dot / pill */}
            <button
              onClick={() => onDotClick(i)}
              style={{
                width:        isActive ? 8 : 7,
                height:       isActive ? 20 : 7,
                borderRadius: 100,
                background:   isActive ? '#E8891A' : 'rgba(27,42,74,0.22)',
                border:       'none',
                cursor:       'pointer',
                padding:       0,
                transition:   'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              aria-label={label}
            />
          </div>
        );
      })}
    </div>
  );
}
