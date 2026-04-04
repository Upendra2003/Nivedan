/**
 * Zone 25–50%: The Big Reveal.
 * Camera pulls back — the entire office chaos was on a phone screen.
 * A large smartphone floats in dark space, screen glowing with the mini office.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

interface Props { scrollProgress: number }

// phone dimensions
const PW = 2.4, PH = 4.8, PD = 0.22;
const SW = 2.05, SH = 4.3;            // screen area

// ── Box helper ───────────────────────────────────────────────────────────────
function B({ w, h, d, x=0, y=0, z=0, rx=0, ry=0, rz=0, c, ol=false }: {
  w:number; h:number; d:number;
  x?:number; y?:number; z?:number;
  rx?:number; ry?:number; rz?:number;
  c:string; ol?:boolean;
}) {
  return (
    <mesh position={[x,y,z]} rotation={[rx,ry,rz]}>
      <boxGeometry args={[w,h,d]} />
      <meshToonMaterial color={c} />
      {ol && <Edges color="#0007" linewidth={1} />}
    </mesh>
  );
}

// ── Mini office on screen (flat 2-D art on the phone face) ──────────────────
function ScreenContent() {
  const sz = 0.115; // z offset — just in front of screen face

  return (
    <group>
      {/* sky / upper wall */}
      <B w={SW} h={SH * 0.45} d={0.01} x={0} y={ SH * 0.27}  z={sz} c="#F5F0DC" />
      {/* dado green strip */}
      <B w={SW} h={SH * 0.14} d={0.01} x={0} y={ SH * 0.03}  z={sz} c="#5B8A5F" />
      {/* floor */}
      <B w={SW} h={SH * 0.28} d={0.01} x={0} y={-SH * 0.30}  z={sz} c="#3D2310" />

      {/* window glow */}
      <mesh position={[0.5, SH*0.28, sz+0.005]}>
        <boxGeometry args={[0.55, 0.68, 0.005]} />
        <meshStandardMaterial color="#a8d8ff" emissive="#87ceeb" emissiveIntensity={2} />
      </mesh>

      {/* mini desk */}
      <B w={0.72} h={0.1}  d={0.01} x={0}     y={-SH*0.14} z={sz+0.005} c="#8B5E3C" />
      <B w={0.72} h={0.32} d={0.01} x={0}     y={-SH*0.22} z={sz+0.005} c="#5a3520" />
      {/* mini man silhouette */}
      <B w={0.12} h={0.38} d={0.01} x={0}     y={-SH*0.06} z={sz+0.006} c="#2c4a6e" />
      <B w={0.13} h={0.13} d={0.01} x={0}     y={ SH*0.04} z={sz+0.006} c="#e8b888" />
      {/* mini filing cabinets */}
      <B w={0.3}  h={0.55} d={0.01} x={-0.8}  y={-SH*0.12} z={sz+0.005} c="#8A9BA8" />
      <B w={0.28} h={0.48} d={0.01} x={-0.56} y={-SH*0.14} z={sz+0.005} c="#7a8a98" />
      {/* colorful file stacks on floor */}
      <B w={0.14} h={0.08} d={0.01} x={-0.5}  y={-SH*0.38} z={sz+0.006} c="#c01020" />
      <B w={0.14} h={0.08} d={0.01} x={-0.5}  y={-SH*0.34} z={sz+0.006} c="#1a3a9a" />
      <B w={0.14} h={0.08} d={0.01} x={-0.5}  y={-SH*0.30} z={sz+0.006} c="#1a6a28" />
      {/* flying paper chaos */}
      <B w={0.14} h={0.18} d={0.01} x={-0.2}  y={ SH*0.12} z={sz+0.007} c="#fffde8" rz={ 0.5} />
      <B w={0.12} h={0.15} d={0.01} x={ 0.35} y={ SH*0.18} z={sz+0.007} c="#fffde8" rz={-0.8} />
      <B w={0.1}  h={0.13} d={0.01} x={-0.55} y={ SH*0.08} z={sz+0.007} c="#fffde8" rz={ 1.1} />
      <B w={0.13} h={0.16} d={0.01} x={ 0.6}  y={-SH*0.04} z={sz+0.007} c="#fffde8" rz={-0.4} />
      <B w={0.11} h={0.14} d={0.01} x={ 0.2}  y={ SH*0.32} z={sz+0.007} c="#fffde8" rz={ 0.9} />

      {/* top status bar */}
      <B w={SW} h={0.12} d={0.01} x={0} y={SH/2 - 0.06} z={sz+0.004} c="#E8891A" />
      {/* app header bar — Nivedan navy */}
      <B w={SW} h={0.38} d={0.01} x={0} y={SH/2 - 0.25} z={sz+0.004} c="#1B2A4A" />
      {/* header title pill */}
      <B w={0.65} h={0.12} d={0.01} x={-0.3} y={SH/2 - 0.25} z={sz+0.006} c="#E8891A" />
      {/* bottom nav bar */}
      <B w={SW} h={0.28} d={0.01} x={0} y={-SH/2 + 0.14} z={sz+0.004} c="#1B2A4A" />
      {/* bottom nav dots */}
      {([-0.7, 0, 0.7] as number[]).map((nx, i) => (
        <B key={i} w={0.08} h={0.08} d={0.01}
           x={nx} y={-SH/2 + 0.14} z={sz+0.006}
           c={i === 1 ? "#E8891A" : "#6080a0"} />
      ))}
      {/* home indicator bar */}
      <B w={0.55} h={0.04} d={0.01} x={0} y={-SH/2 + 0.04} z={sz+0.006} c="#556070" />
    </group>
  );
}

// ── Phone body ───────────────────────────────────────────────────────────────
function Phone() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 3.2 + Math.sin(t * 0.7) * 0.14;
    groupRef.current.rotation.y = Math.sin(t * 0.35) * 0.1;
    groupRef.current.rotation.z = Math.sin(t * 0.28) * 0.025;
  });

  return (
    <group ref={groupRef} position={[0, 3.2, -1]}>
      {/* body */}
      <mesh>
        <boxGeometry args={[PW, PH, PD]} />
        <meshToonMaterial color="#18181e" />
        <Edges color="#444" linewidth={1} />
      </mesh>

      {/* screen surround (bezel) */}
      <B w={SW + 0.14} h={SH + 0.1} d={PD * 0.6} x={0} y={0} z={PD * 0.3} c="#0a0a12" />

      {/* screen base — warm glow like an active govt app */}
      <mesh position={[0, 0, PD/2 + 0.005]}>
        <boxGeometry args={[SW, SH, 0.01]} />
        <meshStandardMaterial
          color="#d8c8a0"
          emissive="#b89860"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* screen content art */}
      <ScreenContent />

      {/* punch-hole front camera */}
      <mesh position={[0, PH/2 - 0.18, PD/2 + 0.015]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 8]} />
        <meshToonMaterial color="#0a0a12" />
      </mesh>

      {/* side buttons (right) */}
      <B w={0.05} h={0.32} d={0.08} x={PW/2 + 0.02} y={ 0.55} z={0} c="#2a2a32" />
      <B w={0.05} h={0.22} d={0.08} x={PW/2 + 0.02} y={ 0.12} z={0} c="#2a2a32" />
      {/* side button (left — volume) */}
      <B w={0.05} h={0.38} d={0.08} x={-PW/2 - 0.02} y={ 0.4} z={0} c="#2a2a32" />
      <B w={0.05} h={0.22} d={0.08} x={-PW/2 - 0.02} y={-0.1} z={0} c="#2a2a32" />

      {/* back — camera island */}
      <B w={0.62} h={0.62} d={0.07} x={0.52} y={PH/2 - 0.52} z={-PD/2 - 0.02} c="#111" />
      <mesh position={[0.52, PH/2 - 0.42, -PD/2 - 0.06]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.52, PH/2 - 0.42, -PD/2 - 0.065]}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 12]} />
        <meshStandardMaterial color="#1a3550" emissive="#1a3550" emissiveIntensity={0.5} />
      </mesh>
      {/* flash */}
      <mesh position={[0.66, PH/2 - 0.64, -PD/2 - 0.06]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        <meshStandardMaterial color="#fffde0" emissive="#fffde0" emissiveIntensity={1} />
      </mesh>

      {/* screen glow halo — saffron rim */}
      <mesh position={[0, 0, PD/2 + 0.02]}>
        <boxGeometry args={[SW + 0.08, SH + 0.08, 0.005]} />
        <meshStandardMaterial
          color="#E8891A"
          emissive="#E8891A"
          emissiveIntensity={0.4}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

// ── Papers escaping the screen into 3D space ─────────────────────────────────
function EscapedPapers() {
  const COUNT = 12;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const data = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      angle0: (i / COUNT) * Math.PI * 2,
      radius: 1.6 + Math.random() * 2.5,
      height0: 2.0 + Math.random() * 3.0,
      speed:   (0.15 + Math.random() * 0.35) * (i%2===0 ? 1 : -1),
      vAmp:    0.12 + Math.random() * 0.3,
      vFreq:   0.4 + Math.random() * 0.6,
      phase:   Math.random() * Math.PI * 2,
      rsX: (Math.random()-0.5)*2.5,
      rsZ: (Math.random()-0.5)*2.5,
      r0X: Math.random()*Math.PI*2,
    }))
  , []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((p, i) => {
      const m = refs.current[i]; if (!m) return;
      const a = p.angle0 + t * p.speed;
      m.position.x = Math.cos(a) * p.radius;
      m.position.y = p.height0 + Math.sin(t*p.vFreq + p.phase)*p.vAmp;
      m.position.z = Math.sin(a) * p.radius - 1;
      m.rotation.x = p.r0X + t*p.rsX*0.5;
      m.rotation.z = t*p.rsZ*0.5;
    });
  });

  return (
    <group>
      {data.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <boxGeometry args={[0.35, 0.005, 0.46]} />
          <meshToonMaterial color="#fffef8" side={THREE.DoubleSide} />
          <Edges color="#ccc" linewidth={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── Cinematic dark backdrop ──────────────────────────────────────────────────
function Backdrop() {
  return (
    <mesh position={[0, 4, -10]}>
      <boxGeometry args={[40, 24, 0.3]} />
      <meshStandardMaterial color="#04080f" />
    </mesh>
  );
}

// ── Zone root ────────────────────────────────────────────────────────────────
export default function PhoneReveal({ scrollProgress }: Props) {
  const visible = scrollProgress > 0.18 && scrollProgress < 0.55;

  return (
    <group visible={visible}>
      <Backdrop />
      <Phone />
      <EscapedPapers />

      {/* screen spill — warm orange light in front of phone */}
      <pointLight position={[0, 3.2,  2.5]} intensity={5}  color="#E8891A" distance={8}  decay={2} />
      {/* cool rim from behind/above */}
      <pointLight position={[0, 9,   -5]}   intensity={6}  color="#3a70b0" distance={14} decay={1.5} />
      {/* subtle edge highlight left */}
      <pointLight position={[-5, 4,   0]}   intensity={2}  color="#4a80c0" distance={10} decay={2} />
      {/* fill so phone sides aren't pitch black */}
      <pointLight position={[5, 2,    4]}   intensity={2}  color="#fff8f0" distance={10} decay={2} />
    </group>
  );
}
