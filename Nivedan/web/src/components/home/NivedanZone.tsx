/**
 * Zone ~40–65%: World Transforms.
 * Sky/landscape persist as backdrop through all story sections.
 * NIVEDAN text + chakra appear briefly as a brand moment before the story zones.
 */
import { Suspense, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface Props { scrollProgress: number }

const SAFFRON = "#E8891A";
const NAVY    = "#1B2A4A";
const WHITE   = "#FFFFFF";

// smooth remap — progress p from [a→b] mapped to [0→1]
function remap(p: number, a: number, b: number) {
  return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
}
function smooth(x: number) { return x * x * (3 - 2 * x); }

// ── Sky layers ────────────────────────────────────────────────────────────────
function Sky() {
  return (
    <group>
      {/* deep navy sky */}
      <mesh position={[0, 8, -22]}>
        <boxGeometry args={[80, 28, 0.5]} />
        <meshStandardMaterial color="#060e22" />
      </mesh>
      {/* mid-sky — dark indigo */}
      <mesh position={[0, 2, -20]}>
        <boxGeometry args={[80, 12, 0.4]} />
        <meshStandardMaterial color="#0d1a3a" />
      </mesh>
      {/* horizon glow — wide saffron strip */}
      <mesh position={[0, -0.5, -18]}>
        <boxGeometry args={[80, 3.5, 0.3]} />
        <meshStandardMaterial
          color="#e86010"
          emissive="#c84808"
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* secondary warm band above horizon */}
      <mesh position={[0, 1.8, -18]}>
        <boxGeometry args={[80, 2, 0.3]} />
        <meshStandardMaterial
          color="#c05020"
          emissive="#a03810"
          emissiveIntensity={0.7}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// ── Ground ────────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <group>
      {/* main ground — deep earthy green */}
      <mesh position={[0, -0.06, -5]}>
        <boxGeometry args={[80, 0.12, 40]} />
        <meshToonMaterial color="#1a3a18" />
      </mesh>
      {/* road / path toward horizon */}
      <mesh position={[0, 0.01, -8]}>
        <boxGeometry args={[3.5, 0.02, 30]} />
        <meshToonMaterial color="#3a3020" />
      </mesh>
      <mesh position={[0, 0.02, -8]}>
        <boxGeometry args={[0.12, 0.025, 30]} />
        <meshStandardMaterial color="#d4b840" emissive="#c0a020" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── Low-poly hills ────────────────────────────────────────────────────────────
function Hills() {
  const hills = [
    { x:-14, z:-14, r:2.8, h:4.5, c:"#152812" },
    { x: -6, z:-16, r:2.2, h:3.8, c:"#1a3018" },
    { x:  2, z:-18, r:3.2, h:5.5, c:"#112210" },
    { x: 10, z:-15, r:2.5, h:4.2, c:"#182a14" },
    { x: 18, z:-13, r:2.8, h:4.0, c:"#152812" },
    { x:-20, z:-12, r:3.0, h:4.8, c:"#0e2010" },
    { x: 24, z:-10, r:2.4, h:3.5, c:"#182a14" },
  ];
  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, h.h/2 - 0.5, h.z]}>
          <coneGeometry args={[h.r, h.h, 6, 1]} />
          <meshToonMaterial color={h.c} />
        </mesh>
      ))}
    </group>
  );
}

// ── City silhouette on horizon ────────────────────────────────────────────────
function CitySilhouette() {
  const buildings = [
    { x:-8, w:1.2, h:2.8 }, { x:-6.5, w:0.9, h:1.8 }, { x:-5.2, w:1.4, h:3.5 },
    { x:-3.6, w:1.0, h:2.2 }, { x:-2.4, w:0.8, h:1.5 }, { x:-1.2, w:1.8, h:4.2 },
    { x: 0.8, w:1.0, h:2.8 }, { x: 2.0, w:1.5, h:3.2 }, { x: 3.7, w:0.9, h:1.8 },
    { x: 4.8, w:1.3, h:2.6 }, { x: 6.3, w:0.8, h:3.8 }, { x: 7.5, w:1.1, h:2.0 },
  ];
  return (
    <group position={[0, 0, -15]}>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h/2 - 0.5, 0]}>
          <boxGeometry args={[b.w, b.h, 0.3]} />
          <meshStandardMaterial color="#0a1828" />
        </mesh>
      ))}
    </group>
  );
}

// ── Rising sun ────────────────────────────────────────────────────────────────
function RisingSun({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = smooth(remap(scrollProgress, 0.40, 0.56));

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.025;
    groupRef.current.scale.setScalar(pulse);
  });

  const sunY = -4 + t * 5.5;

  return (
    <group ref={groupRef} position={[0, sunY, -16]}>
      {/* sun core */}
      <mesh>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial color="#ff8c00" emissive="#ff6000" emissiveIntensity={2} />
      </mesh>
      {/* outer glow ring */}
      <mesh>
        <icosahedronGeometry args={[3.0, 1]} />
        <meshStandardMaterial color="#E8891A" emissive="#E8891A" emissiveIntensity={0.6} transparent opacity={0.25} />
      </mesh>
      {/* corona */}
      <mesh>
        <icosahedronGeometry args={[4.2, 1]} />
        <meshStandardMaterial color="#ff6000" emissive="#ff4000" emissiveIntensity={0.3} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// ── NIVEDAN text ──────────────────────────────────────────────────────────────
function NivedanText({ scrollProgress }: { scrollProgress: number }) {
  const t = smooth(remap(scrollProgress, 0.44, 0.56));
  const scale = 0.05 + t * 0.95;
  const y     = 4.5 + t * 2.2;

  return (
    <group position={[0, y, -8]} scale={[scale, scale, scale]}>
      <Suspense fallback={null}>
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[16, 3.2, 0.1]} />
          <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.2} transparent opacity={0.12} />
        </mesh>
        <Text fontSize={2.6} color={SAFFRON} anchorX="center" anchorY="middle" letterSpacing={0.08} outlineWidth={0.04} outlineColor="#7a3800">
          NIVEDAN
        </Text>
        <Text fontSize={2.6} color="#00000022" anchorX="center" anchorY="middle" letterSpacing={0.08} position={[0.04, -0.06, -0.05]}>
          NIVEDAN
        </Text>
      </Suspense>
    </group>
  );
}

// ── Tagline ───────────────────────────────────────────────────────────────────
function Tagline({ scrollProgress }: { scrollProgress: number }) {
  const t = smooth(remap(scrollProgress, 0.50, 0.60));

  return (
    <group position={[0, 3.5 + t * 0.5, -7.5]}>
      <Suspense fallback={null}>
        <Text fontSize={0.55} color={WHITE} anchorX="center" anchorY="middle" letterSpacing={0.12} fillOpacity={t}>
          Govt. From your pocket.
        </Text>
      </Suspense>
    </group>
  );
}

// ── Ashoka-inspired spinning ring ─────────────────────────────────────────────
function SpinningRing({ scrollProgress }: { scrollProgress: number }) {
  const ringRef = useRef<THREE.Group>(null);
  const t = smooth(remap(scrollProgress, 0.48, 0.58));

  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.4;
  });

  if (t < 0.01) return null;

  const spokes = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);

  return (
    <group position={[0, 6.6, -8]} scale={[t, t, t]}>
      <group ref={ringRef}>
        {spokes.map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0]}>
            <boxGeometry args={[0.08, 0.32, 0.04]} />
            <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.8} transparent opacity={0.7} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
          <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
}

// ── Rising saffron particles ──────────────────────────────────────────────────
function SaffronParticles() {
  const COUNT = 50;
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const data = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      x:     (Math.random() - 0.5) * 22,
      y0:    Math.random() * 10,
      z:    -4 - Math.random() * 12,
      speed: 0.4 + Math.random() * 0.8,
      sway:  (Math.random() - 0.5) * 1.2,
      phase: Math.random() * Math.PI * 2,
      size:  0.05 + Math.random() * 0.12,
      bright: Math.random() > 0.6,
    }))
  , []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((p, i) => {
      const m = refs.current[i]; if (!m) return;
      m.position.x = p.x + Math.sin(t * 0.6 + p.phase) * p.sway;
      m.position.y = ((p.y0 + t * p.speed) % 12) - 1;
      m.position.z = p.z;
    });
  });

  return (
    <group>
      {data.map((p, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <octahedronGeometry args={[p.size, 0]} />
          <meshStandardMaterial color={p.bright ? "#ffaa30" : SAFFRON} emissive={p.bright ? "#ffaa30" : SAFFRON} emissiveIntensity={p.bright ? 3 : 1.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Zone root ─────────────────────────────────────────────────────────────────
export default function NivedanZone({ scrollProgress }: Props) {
  // Sky/sun/landscape persist as backdrop through all story sections
  const visible = scrollProgress > 0.38;
  // NIVEDAN text + chakra only during the brand moment (before story phones appear)
  const textVisible = scrollProgress > 0.43 && scrollProgress < 0.62;

  return (
    <group visible={visible}>
      <Sky />
      <Ground />
      <Hills />
      <CitySilhouette />
      <RisingSun        scrollProgress={scrollProgress} />
      <SaffronParticles />
      {/* Brand moment text */}
      <group visible={textVisible}>
        <NivedanText  scrollProgress={scrollProgress} />
        <Tagline      scrollProgress={scrollProgress} />
        <SpinningRing scrollProgress={scrollProgress} />
      </group>

      {/* LIGHTING */}
      <pointLight position={[0,  0, -14]} intensity={12} color="#ff6020" distance={30} decay={1.2} />
      <pointLight position={[0, -1,  -4]} intensity={5}  color="#E8891A" distance={18} decay={1.5} />
      <pointLight position={[0, 14,  -6]} intensity={3}  color="#1B2A4A" distance={20} decay={1.5} />
      <pointLight position={[0,  7,  -5]} intensity={4}  color="#E8891A" distance={12} decay={2} />
    </group>
  );
}
