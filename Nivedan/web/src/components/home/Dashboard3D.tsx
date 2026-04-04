/**
 * Story Zones 3–5: Post-phone-reveal storytelling.
 * Section 1 (46–63%): Phone on left showing Nivedan home UI
 * Section 2 (62–77%): Phone on right showing multilingual screen
 * (Sections 3–5 are handled by HTML overlays in Overlay.tsx)
 */
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

interface Props { scrollProgress: number }

const SAFFRON = "#E8891A";
const NAVY    = "#1B2A4A";

function smooth(x: number) { return x * x * (3 - 2 * x); }
function remap(p: number, a: number, b: number) {
  return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
}

// ── Flat box helper ───────────────────────────────────────────────────────────
function B({ w, h, d=0.02, x=0, y=0, z=0, c, emI=0 }: {
  w:number; h:number; d?:number;
  x?:number; y?:number; z?:number;
  c:string; emI?:number;
}) {
  return (
    <mesh position={[x,y,z]}>
      <boxGeometry args={[w,h,d]} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={emI} />
    </mesh>
  );
}

// ── Phone shell ───────────────────────────────────────────────────────────────
function PhoneShell() {
  return (
    <>
      <mesh>
        <boxGeometry args={[1.9, 3.8, 0.2]} />
        <meshToonMaterial color="#18181e" />
        <Edges color="#ffffff18" linewidth={1} />
      </mesh>
      {/* screen bezel */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[1.7, 3.58, 0.04]} />
        <meshToonMaterial color="#060e1a" />
      </mesh>
    </>
  );
}

// ── Section 1 screen: Nivedan home ───────────────────────────────────────────
function NivedanHomeScreen() {
  const cats = [
    { x:-0.37, y: 0.32, c:"#1a4aaa" },
    { x:  0.0, y: 0.32, c:"#c01020" },
    { x: 0.37, y: 0.32, c:"#1a6a28" },
    { x:-0.37, y:-0.14, c:"#c09010" },
    { x:  0.0, y:-0.14, c:"#7a1a8a" },
    { x: 0.37, y:-0.14, c:"#1a7a9a" },
  ];
  return (
    <group position={[0, 0, 0.12]}>
      {/* saffron header */}
      <B w={1.66} h={0.32} y={1.68} c={SAFFRON} emI={0.3} />
      <B w={0.7}  h={0.09} x={-0.2} y={1.7} z={0.02} c="#fff" />
      {/* search bar */}
      <B w={1.5} h={0.2} y={1.26} c="#0d1521" />
      {/* category grid */}
      {cats.map((cat, i) => (
        <group key={i} position={[cat.x, cat.y, 0]}>
          <B w={0.44} h={0.44} c={cat.c} />
          <B w={0.28} h={0.06} y={-0.17} z={0.02} c="#ddd" />
        </group>
      ))}
      {/* recent row */}
      <B w={1.6} h={0.24} y={-0.64} c="#1a2535" />
      <B w={0.08} h={0.2} x={-0.73} y={-0.64} z={0.02} c={SAFFRON} emI={0.4} />
      <B w={0.9}  h={0.08} x={0.1}  y={-0.6}  z={0.02} c="#ccc" />
      <B w={0.65} h={0.07} x={0.0}  y={-0.72} z={0.02} c="#777" />
      {/* bottom nav */}
      <B w={1.66} h={0.26} y={-1.68} c={NAVY} />
      {([-0.5, 0, 0.5] as number[]).map((nx, i) => (
        <B key={i} w={0.12} h={0.12} x={nx} y={-1.68} z={0.02} c={i===0 ? SAFFRON : "#445"} emI={i===0 ? 0.5 : 0} />
      ))}
    </group>
  );
}

// ── Section 2 screen: language picker ────────────────────────────────────────
function LanguageScreen() {
  const langs = [
    { y: 1.05, c:"#e65c20", accent:"#ff8040" },
    { y: 0.55, c:"#1a5aaa", accent:"#4080ff" },
    { y: 0.05, c:"#1a7a28", accent:"#40c060" },
    { y:-0.45, c:"#9a1a9a", accent:"#d040d0" },
    { y:-0.95, c:"#c08010", accent:"#f0a020" },
  ];
  return (
    <group position={[0, 0, 0.12]}>
      {/* header */}
      <B w={1.66} h={0.32} y={1.68} c={NAVY} />
      <B w={0.8}  h={0.09} x={-0.2} y={1.7} z={0.02} c="#ddd" />
      {/* "Choose your language" label */}
      <B w={1.2} h={0.09} y={1.26} z={0.02} c="#888" />
      {/* language option cards */}
      {langs.map((l, i) => (
        <group key={i} position={[0, l.y, 0]}>
          <B w={1.6} h={0.34} c={l.c + "28"} />
          <B w={0.06} h={0.28} d={0.03} x={-0.74} z={0.02} c={l.accent} emI={0.6} />
          <B w={0.55} h={0.09} x={0.08} y={0.06} z={0.02} c={l.accent} emI={0.2} />
          <B w={0.8}  h={0.07} x={-0.05} y={-0.07} z={0.02} c="#666" />
        </group>
      ))}
      {/* bottom nav */}
      <B w={1.66} h={0.26} y={-1.68} c={NAVY} />
    </group>
  );
}

// ── Animated phone wrapper ────────────────────────────────────────────────────
function StoryPhone({
  position, tiltY, screen, entryAt, exitAt, scrollProgress
}: {
  position: [number,number,number];
  tiltY: number;
  screen: React.ReactNode;
  entryAt: number;
  exitAt: number;
  scrollProgress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spRef    = useRef(scrollProgress);
  useEffect(() => { spRef.current = scrollProgress; }, [scrollProgress]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const sp   = spRef.current;
    const tIn  = smooth(remap(sp, entryAt, entryAt + 0.06));
    const tOut = smooth(remap(sp, exitAt - 0.05, exitAt));
    const vis  = tIn * (1 - tOut);
    const bob  = Math.sin(clock.getElapsedTime() * 0.85 + position[0]) * 0.09;
    groupRef.current.position.y = position[1] + bob - (1 - tIn) * 4;
    groupRef.current.scale.setScalar(Math.max(0.001, vis));
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, tiltY, 0]}>
      <PhoneShell />
      {screen}
    </group>
  );
}

// ── Zone root ─────────────────────────────────────────────────────────────────
export default function Dashboard3D({ scrollProgress }: Props) {
  return (
    <group>
      {/* Section 1: Left phone — Nivedan home screen */}
      <StoryPhone
        position={[-3.6, 2.4, -5]}
        tiltY={0.18}
        screen={<NivedanHomeScreen />}
        entryAt={0.46}
        exitAt={0.64}
        scrollProgress={scrollProgress}
      />

      {/* Section 2: Right phone — language picker screen */}
      <StoryPhone
        position={[3.6, 2.4, -5]}
        tiltY={-0.18}
        screen={<LanguageScreen />}
        entryAt={0.62}
        exitAt={0.78}
        scrollProgress={scrollProgress}
      />

      {/* Fill lights */}
      <pointLight position={[-3.5, 4, -2]} intensity={5} color={SAFFRON} distance={12} decay={2} />
      <pointLight position={[ 3.5, 4, -2]} intensity={5} color="#6080ff" distance={12} decay={2} />
    </group>
  );
}
