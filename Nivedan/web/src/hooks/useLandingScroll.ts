import { useRef, useState, useEffect } from 'react';

export interface LandingScrollState {
  /** Raw 0-1 progress ref — read inside useFrame with zero re-render cost. */
  progressRef: React.MutableRefObject<number>;
  /** Current section 0-5 — triggers re-render only on section boundary. */
  section: number;
}

/**
 * Tracks window scroll over 6 × 100vh sections (600 vh total).
 * progressRef is updated every scroll event without causing re-renders.
 * section only causes a re-render when the section index changes (≤6 times).
 */
export function useLandingScroll(): LandingScrollState {
  const progressRef = useRef<number>(0);
  const [section, setSection] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const raw = window.scrollY / (window.innerHeight * 6);
      const p   = Math.min(Math.max(raw, 0), 1);
      progressRef.current = p;
      const s = Math.min(Math.floor(p * 6), 5);
      setSection(prev => (prev !== s ? s : prev));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial value
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { progressRef, section };
}
