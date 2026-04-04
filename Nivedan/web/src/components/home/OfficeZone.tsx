import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

interface Props { scrollProgress: number }

const C = {
  wallUpper:  "#F5F0DC",   // aged institutional yellow
  wallDado:   "#5B8A5F",   // govt department green
  dadoRail:   "#4A5240",   // dark olive divider line
  windowFrame:"#5C3A1E",   // dark teak window frame
  floor:      "#3D2310",   // rich dark brown
  ceiling:    "#EEEBE0",   // aged cream
  wood:       "#8B5E3C",   // teak desk
  darkWood:   "#5a3520",   // teak shadow side
  chairSeat:  "#8FAF8F",   // faded institutional green
  chairLeg:   "#3A3A3A",   // dark iron
  mat:        "#7A2020",   // worn maroon carpet
  suit:       "#2c4a6e",   // man's suit (keep)
  skin:       "#e8b888",
  hair:       "#1a0800",
  paper:      "#fffef8",   // white papers
  cabinet:    "#8A9BA8",   // steel grey
  metal:      "#8899aa",
  black:      "#111",
  pot:        "#b84e20",
  cork:       "#c89a40",
  frame:      "#3a2008",
  fileRed:    "#c01020",   // keep colorful files exactly
  fileBlue:   "#1a3a9a",
  fileGreen:  "#1a6a28",
  fileYellow: "#c09010",
};

function B({ w, h, d, x=0, y=0, z=0, rx=0, ry=0, rz=0, c, ol=true }: {
  w:number; h:number; d:number;
  x?:number; y?:number; z?:number;
  rx?:number; ry?:number; rz?:number;
  c:string; ol?:boolean;
}) {
  return (
    <mesh position={[x,y,z]} rotation={[rx,ry,rz]}>
      <boxGeometry args={[w,h,d]} />
      <meshToonMaterial color={c} />
      {ol && <Edges color="#0005" linewidth={1} />}
    </mesh>
  );
}

// ── ROOM ────────────────────────────────────────────────────────────────────
function Room() {
  return (
    <group>
      {/* floor — dark hardwood */}
      <B w={18} h={0.12} d={20} x={0} y={-0.06} z={-3} c={C.floor} ol={false} />

      {/* back wall — dado lower, cream upper */}
      <B w={18} h={5.8} d={0.14} x={0} y={4.9} z={-8}  c={C.wallUpper} ol={false} />
      <B w={18} h={1.5} d={0.18} x={0} y={0.75} z={-8} c={C.wallDado}  ol={false} />
      <B w={18} h={0.1} d={0.14} x={0} y={1.54} z={-7.95} c={C.dadoRail} ol={false} />

      {/* left wall */}
      <B w={0.14} h={5.8} d={20} x={-9} y={4.9} z={-3}  c={C.wallUpper} ol={false} />
      <B w={0.18} h={1.5} d={20} x={-9} y={0.75} z={-3} c={C.wallDado}  ol={false} />
      <B w={0.14} h={0.1} d={20} x={-8.95} y={1.54} z={-3} c={C.dadoRail} ol={false} />

      {/* right wall */}
      <B w={0.14} h={5.8} d={20} x={9} y={4.9} z={-3}   c={C.wallUpper} ol={false} />
      <B w={0.18} h={1.5} d={20} x={9} y={0.75} z={-3}  c={C.wallDado}  ol={false} />
      <B w={0.14} h={0.1} d={20} x={8.95} y={1.54} z={-3} c={C.dadoRail} ol={false} />

      {/* ceiling */}
      <B w={18} h={0.14} d={20} x={0} y={7.93} z={-3} c={C.ceiling} ol={false} />

      {/* window — back wall bright daylight */}
      <mesh position={[3, 4.2, -7.92]}>
        <boxGeometry args={[2.8, 3.2, 0.06]} />
        <meshStandardMaterial color="#b8deff" emissive="#87ceeb" emissiveIntensity={2.5} />
      </mesh>
      {/* window frames */}
      <B w={3.0} h={0.1} d={0.14} x={3} y={5.85} z={-7.9} c={C.windowFrame} />
      <B w={3.0} h={0.1} d={0.14} x={3} y={2.55} z={-7.9} c={C.windowFrame} />
      <B w={0.1} h={3.4} d={0.14} x={1.5} y={4.2} z={-7.9} c={C.windowFrame} />
      <B w={0.1} h={3.4} d={0.14} x={4.5} y={4.2} z={-7.9} c={C.windowFrame} />
      <B w={0.1} h={3.4} d={0.14} x={3}   y={4.2} z={-7.9} c={C.windowFrame} />
      <B w={3.0} h={0.1} d={0.14} x={3}   y={4.2} z={-7.9} c={C.windowFrame} />
      {/* window sill */}
      <B w={3.2} h={0.1} d={0.3} x={3} y={2.48} z={-7.75} c={C.windowFrame} />
      {/* curtains */}
      <B w={0.55} h={3.4} d={0.1} x={1.3} y={4.2} z={-7.84} c="#c8a84a" ry={0.1} />
      <B w={0.55} h={3.4} d={0.1} x={4.7} y={4.2} z={-7.84} c="#c8a84a" ry={-0.1} />
      <B w={3.8} h={0.08} d={0.08} x={3} y={5.92} z={-7.78} c={C.windowFrame} />

      {/* fluorescent light fixture */}
      <B w={1.4} h={0.06} d={0.38} x={0} y={7.88} z={-2} c="#ccc" ol={false} />
      <mesh position={[0, 7.84, -2]}>
        <boxGeometry args={[1.2, 0.04, 0.28]} />
        <meshStandardMaterial color="#fffff0" emissive="#fffde0" emissiveIntensity={5} />
      </mesh>
    </group>
  );
}

// ── CEILING FAN ──────────────────────────────────────────────────────────────
function CeilingFan() {
  const bladeRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (bladeRef.current) bladeRef.current.rotation.y += dt * 2.8; });
  return (
    <group position={[-2, 7.88, -4]}>
      <B w={0.06} h={0.55} d={0.06} x={0} y={-0.28} z={0} c={C.metal} />
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 8]} />
        <meshToonMaterial color="#777" />
      </mesh>
      <group ref={bladeRef} position={[0, -0.63, 0]}>
        <B w={2.4} h={0.04} d={0.26} c="#d8d0b0" />
        <B w={2.4} h={0.04} d={0.26} ry={Math.PI*2/3}  c="#d8d0b0" />
        <B w={2.4} h={0.04} d={0.26} ry={Math.PI*4/3}  c="#d8d0b0" />
      </group>
    </group>
  );
}

// ── NOTICE BOARD ─────────────────────────────────────────────────────────────
function NoticeBoard() {
  return (
    <group position={[-2.5, 3.8, -7.9]}>
      <B w={1.7} h={1.1} d={0.05} c={C.cork} />
      <B w={1.82} h={0.09} d={0.08} x={0} y={ 0.6} z={0} c={C.frame} />
      <B w={1.82} h={0.09} d={0.08} x={0} y={-0.6} z={0} c={C.frame} />
      <B w={0.09} h={1.22} d={0.08} x={ 0.93} y={0} z={0} c={C.frame} />
      <B w={0.09} h={1.22} d={0.08} x={-0.93} y={0} z={0} c={C.frame} />
      {/* pinned papers */}
      <B w={0.35} h={0.45} d={0.02} x={-0.52} y={ 0.1} z={0.05} c="#fff"    rz={-0.06} />
      <B w={0.38} h={0.5}  d={0.02} x={ 0.05} y={ 0.08} z={0.05} c="#fffde0" rz={ 0.04} />
      <B w={0.32} h={0.42} d={0.02} x={ 0.55} y={ 0.12} z={0.05} c="#e8f0ff" rz={-0.08} />
      <B w={0.3}  h={0.22} d={0.02} x={-0.48} y={-0.3} z={0.05}  c="#ffe8e8" rz={ 0.05} />
      <B w={0.32} h={0.24} d={0.02} x={ 0.42} y={-0.28} z={0.05} c="#e8ffe8" rz={-0.04} />
      {/* pushpins */}
      <B w={0.04} h={0.04} d={0.04} x={-0.52} y={ 0.35} z={0.08} c="#c82020" />
      <B w={0.04} h={0.04} d={0.04} x={ 0.05} y={ 0.35} z={0.08} c="#1a4aaa" />
      <B w={0.04} h={0.04} d={0.04} x={ 0.55} y={ 0.38} z={0.08} c="#2a8a30" />
    </group>
  );
}

// ── WALL CLOCK ───────────────────────────────────────────────────────────────
function WallClock() {
  const minRef  = useRef<THREE.Group>(null);
  const secRef  = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (minRef.current) minRef.current.rotation.z = -t * 0.001745;
    if (secRef.current) secRef.current.rotation.z = -t * 0.1047;
  });
  return (
    <group position={[5.5, 5.2, -7.9]}>
      <B w={0.86} h={0.86} d={0.05} c="#f5efe0" />
      <B w={0.94} h={0.09} d={0.07} x={0} y={ 0.47} z={0} c="#333" />
      <B w={0.94} h={0.09} d={0.07} x={0} y={-0.47} z={0} c="#333" />
      <B w={0.09} h={0.94} d={0.07} x={ 0.47} y={0} z={0} c="#333" />
      <B w={0.09} h={0.94} d={0.07} x={-0.47} y={0} z={0} c="#333" />
      {/* 12/3/6/9 markers */}
      <B w={0.04} h={0.09} d={0.02} x={0}    y={ 0.38} z={0.06} c="#333" />
      <B w={0.09} h={0.04} d={0.02} x={ 0.38} y={0}    z={0.06} c="#333" />
      <B w={0.04} h={0.09} d={0.02} x={0}    y={-0.38} z={0.06} c="#333" />
      <B w={0.09} h={0.04} d={0.02} x={-0.38} y={0}    z={0.06} c="#333" />
      {/* minute hand */}
      <group ref={minRef} position={[0, 0, 0.06]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.035, 0.24, 0.015]} />
          <meshToonMaterial color="#222" />
        </mesh>
      </group>
      {/* second hand */}
      <group ref={secRef} position={[0, 0, 0.08]}>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.016, 0.3, 0.01]} />
          <meshToonMaterial color="#c82020" />
        </mesh>
      </group>
      <B w={0.07} h={0.07} d={0.1} x={0} y={0} z={0.09} c="#222" />
    </group>
  );
}

// ── PORTRAIT FRAME (left wall) ───────────────────────────────────────────────
function PortraitFrame() {
  return (
    <group position={[-8.9, 4.5, -3.5]} rotation={[0, Math.PI/2, 0]}>
      <B w={1.0} h={1.3} d={0.05} c="#c8a840" />
      <B w={1.1} h={0.09} d={0.09} x={0} y={ 0.7} z={0} c={C.frame} />
      <B w={1.1} h={0.09} d={0.09} x={0} y={-0.7} z={0} c={C.frame} />
      <B w={0.09} h={1.42} d={0.09} x={ 0.58} y={0} z={0} c={C.frame} />
      <B w={0.09} h={1.42} d={0.09} x={-0.58} y={0} z={0} c={C.frame} />
      <B w={0.85} h={1.12} d={0.02} c="#e8e0c8" />
      <B w={0.38} h={0.38} d={0.02} x={0} y={ 0.18} z={0.03} c={C.skin} />
      <B w={0.46} h={0.38} d={0.02} x={0} y={-0.22} z={0.03} c={C.suit} />
    </group>
  );
}

// ── FLOOR MAT ────────────────────────────────────────────────────────────────
function FloorMat() {
  return (
    <group>
      <B w={4.6} h={0.045} d={3.2} x={0} y={0.022} z={-0.4} c={C.mat} ol={false} />
      <B w={4.3} h={0.05}  d={2.9} x={0} y={0.028} z={-0.4} c="#8a2a2a" ol={false} />
      <B w={3.7} h={0.055} d={2.3} x={0} y={0.032} z={-0.4} c={C.mat} ol={false} />
    </group>
  );
}

// ── DESK + CHAIRS ────────────────────────────────────────────────────────────
function Desk() {
  return (
    <group>
      {/* desk top */}
      <B w={3.4} h={0.12} d={1.8} x={0} y={1.0} z={-0.6} c={C.wood} />
      <B w={0.12} h={0.92} d={1.7} x={-1.62} y={0.53} z={-0.6} c={C.darkWood} />
      <B w={0.12} h={0.92} d={1.7} x={ 1.62} y={0.53} z={-0.6} c={C.darkWood} />
      <B w={3.4}  h={0.92} d={0.12} x={0}    y={0.53} z={-1.44} c={C.darkWood} />
      {/* drawer */}
      <B w={0.88} h={0.18} d={0.05} x={-0.5} y={0.72} z={0.16} c={C.darkWood} />
      <B w={0.08} h={0.07} d={0.06} x={-0.5} y={0.72} z={0.2} c={C.metal} />
      {/* nameplate */}
      <B w={0.56} h={0.12} d={0.04} x={0} y={1.07} z={0.26} c="#c8b860" />
      <B w={0.5}  h={0.07} d={0.02} x={0} y={1.07} z={0.29} c="#111" />
      {/* CRT monitor */}
      <B w={0.82} h={0.66} d={0.09} x={0.9} y={1.42} z={-1.28} c="#181828" />
      <B w={0.52} h={0.52} d={0.54} x={0.9} y={1.22} z={-0.99} c="#1e1e30" />
      <B w={0.26} h={0.18} d={0.1}  x={0.9} y={1.06} z={-1.28} c={C.metal} />
      {/* rotary phone */}
      <B w={0.3} h={0.1} d={0.4} x={-1.1} y={1.08} z={-0.72} c="#222" ry={0.2} />
      <mesh position={[-1.1, 1.15, -0.62]}>
        <cylinderGeometry args={[0.09, 0.09, 0.07, 8]} />
        <meshToonMaterial color="#333" />
      </mesh>
      {/* tea cup */}
      <mesh position={[0.3, 1.12, -0.38]}>
        <cylinderGeometry args={[0.07, 0.06, 0.11, 8]} />
        <meshToonMaterial color="#f0e8d8" />
      </mesh>
      <mesh position={[0.3, 1.065, -0.38]}>
        <cylinderGeometry args={[0.13, 0.13, 0.025, 8]} />
        <meshToonMaterial color="#f0e8d8" />
      </mesh>
      {/* tea liquid */}
      <mesh position={[0.3, 1.17, -0.38]}>
        <cylinderGeometry args={[0.065, 0.065, 0.01, 8]} />
        <meshStandardMaterial color="#7a4010" />
      </mesh>
      {/* inbox tray */}
      <B w={0.72} h={0.06} d={0.52} x={-0.72} y={1.06} z={-0.58} c={C.metal} />
      <B w={0.68} h={0.14} d={0.02} x={-0.72} y={1.1} z={-0.83} c={C.metal} />
      <B w={0.68} h={0.14} d={0.02} x={-0.72} y={1.1} z={-0.34} c={C.metal} />
      <B w={0.65} h={0.04} d={0.46} x={-0.72} y={1.1}  z={-0.58} c={C.paper} rz={ 0.04} />
      <B w={0.65} h={0.04} d={0.46} x={-0.72} y={1.14} z={-0.58} c={C.paper} rz={-0.03} />
      <B w={0.65} h={0.04} d={0.46} x={-0.72} y={1.18} z={-0.57} c={C.paper} rz={ 0.08} />
      <B w={0.64} h={0.04} d={0.44} x={-0.68} y={1.22} z={-0.53} c={C.paper} rz={ 0.18} rx={0.08} />
      {/* main chair */}
      <B w={0.95} h={0.08} d={0.95} x={0} y={0.5}  z={-1.75} c={C.chairSeat} />
      <B w={0.95} h={0.95} d={0.09} x={0} y={0.98} z={-2.22} c={C.chairSeat} />
      <B w={0.06} h={0.5} d={0.06} x={-0.42} y={0.25} z={-1.28} c={C.chairLeg} />
      <B w={0.06} h={0.5} d={0.06} x={ 0.42} y={0.25} z={-1.28} c={C.chairLeg} />
      <B w={0.06} h={0.5} d={0.06} x={-0.42} y={0.25} z={-2.22} c={C.chairLeg} />
      <B w={0.06} h={0.5} d={0.06} x={ 0.42} y={0.25} z={-2.22} c={C.chairLeg} />
      <B w={0.06} h={0.06} d={0.62} x={-0.5} y={0.97} z={-1.75} c={C.chairLeg} />
      <B w={0.06} h={0.06} d={0.62} x={ 0.5} y={0.97} z={-1.75} c={C.chairLeg} />
      {/* visitor chairs */}
      {([-1.0, 1.0] as number[]).map((vx, i) => (
        <group key={i} position={[vx, 0, 1.5]}>
          <B w={0.72} h={0.07} d={0.72} x={0} y={0.48} z={0} c={C.chairSeat} />
          <B w={0.72} h={0.72} d={0.08} x={0} y={0.84} z={-0.32} c={C.chairSeat} />
          <B w={0.04} h={0.48} d={0.04} x={-0.32} y={0.24} z={-0.32} c={C.chairLeg} />
          <B w={0.04} h={0.48} d={0.04} x={ 0.32} y={0.24} z={-0.32} c={C.chairLeg} />
          <B w={0.04} h={0.48} d={0.04} x={-0.32} y={0.24} z={ 0.32} c={C.chairLeg} />
          <B w={0.04} h={0.48} d={0.04} x={ 0.32} y={0.24} z={ 0.32} c={C.chairLeg} />
        </group>
      ))}
    </group>
  );
}

// ── MAN ──────────────────────────────────────────────────────────────────────
function Man() {
  const headRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (headRef.current)
      headRef.current.position.y = 1.12 + Math.sin(clock.getElapsedTime() * 0.9) * 0.012;
  });
  return (
    <group>
      <mesh position={[0, 1.18, -1.45]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.65, 0.75, 0.3]} /><meshToonMaterial color={C.suit} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <B w={0.24} h={0.14} d={0.12} x={0} y={1.56} z={-1.32} c="#d8d0c0" />
      <B w={0.17} h={0.24} d={0.14} x={0} y={1.52} z={-1.2} rx={0.3} c={C.skin} />
      <mesh ref={headRef} position={[0, 1.12, -0.82]} rotation={[0.52, 0, 0]}>
        <boxGeometry args={[0.44, 0.42, 0.38]} /><meshToonMaterial color={C.skin} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <B w={0.46} h={0.14} d={0.4} x={0} y={1.32} z={-0.8} rx={0.52} c={C.hair} />
      <mesh position={[-0.38, 1.2, -1.18]} rotation={[0.55, 0, 0.08]}>
        <boxGeometry args={[0.18, 0.18, 0.52]} /><meshToonMaterial color={C.suit} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <mesh position={[0.38, 1.2, -1.18]} rotation={[0.55, 0, -0.08]}>
        <boxGeometry args={[0.18, 0.18, 0.52]} /><meshToonMaterial color={C.suit} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <B w={0.15} h={0.13} d={0.52} x={-0.4} y={1.08} z={-0.82} c={C.suit} />
      <B w={0.15} h={0.13} d={0.52} x={ 0.4} y={1.08} z={-0.82} c={C.suit} />
      <B w={0.13} h={0.09} d={0.15} x={-0.4} y={1.1}  z={-0.57} c={C.skin} />
      <B w={0.13} h={0.09} d={0.15} x={ 0.4} y={1.1}  z={-0.57} c={C.skin} />
      <mesh position={[-0.19, 0.75, -1.75]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.22, 0.2, 0.72]} /><meshToonMaterial color={C.suit} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <mesh position={[ 0.19, 0.75, -1.75]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.22, 0.2, 0.72]} /><meshToonMaterial color={C.suit} /><Edges color="#0006" linewidth={1} />
      </mesh>
      <B w={0.18} h={0.58} d={0.18} x={-0.19} y={0.41} z={-2.18} c={C.suit} />
      <B w={0.18} h={0.58} d={0.18} x={ 0.19} y={0.41} z={-2.18} c={C.suit} />
      <B w={0.22} h={0.1} d={0.34} x={-0.19} y={0.1} z={-2.14} c={C.black} />
      <B w={0.22} h={0.1} d={0.34} x={ 0.19} y={0.1} z={-2.14} c={C.black} />
    </group>
  );
}

// ── FILING CABINETS ──────────────────────────────────────────────────────────
function FilingCabinets() {
  return (
    <group>
      <B w={0.9} h={2.3} d={0.72} x={-3.2} y={1.15} z={-7.2} c={C.cabinet} />
      <B w={0.9} h={2.3} d={0.72} x={-4.2} y={1.15} z={-7.2} c={C.cabinet} />
      <B w={0.9} h={1.8} d={0.72} x={-5.2} y={0.9}  z={-7.2} c={C.cabinet} />
      {([-3.2, -4.2] as number[]).map((bx, bi) =>
        [1.65, 1.15, 0.65].map((by, i) => (
          <B key={`${bi}-${i}`} w={0.32} h={0.04} d={0.06} x={bx} y={by} z={-6.86} c="#aaa" />
        ))
      )}
      {[-5.2].map(bx =>
        [1.3, 0.8].map((by, i) => (
          <B key={`s${i}`} w={0.32} h={0.04} d={0.06} x={bx} y={by} z={-6.86} c="#aaa" />
        ))
      )}
      <B w={0.72} h={0.08} d={0.58} x={-3.2} y={2.38} z={-7.06} c={C.paper} rx={0.1}  rz={ 0.18} />
      <B w={0.62} h={0.07} d={0.52} x={-4.2} y={2.38} z={-7.06} c={C.paper} rx={-0.04} rz={-0.12} />
      {/* small succulent on top of cabinet */}
      <mesh position={[-3.2, 2.42, -7.2]}>
        <cylinderGeometry args={[0.1, 0.08, 0.2, 6]} />
        <meshToonMaterial color={C.pot} />
      </mesh>
      <B w={0.22} h={0.07} d={0.16} x={-3.14} y={2.7} z={-7.2} c="#2a7a30" rz={ 0.3} rx={0.2} />
      <B w={0.2}  h={0.07} d={0.14} x={-3.28} y={2.74} z={-7.15} c="#3a9a40" rz={-0.28} rx={-0.15} />
      {/* right wall cabinet */}
      <B w={0.9} h={2.6} d={0.72} x={7.5} y={1.3} z={-6.5} c={C.cabinet} />
      <B w={0.32} h={0.04} d={0.06} x={7.5} y={2.1}  z={-6.16} c="#aaa" />
      <B w={0.32} h={0.04} d={0.06} x={7.5} y={1.55} z={-6.16} c="#aaa" />
      <B w={0.32} h={0.04} d={0.06} x={7.5} y={1.0}  z={-6.16} c="#aaa" />
    </group>
  );
}

// ── FILE STACKS ──────────────────────────────────────────────────────────────
function FileStacks() {
  const stacks = [
    { x:-2.2, z: 0.8, files:[C.fileRed, C.fileBlue, C.fileGreen, C.fileRed] },
    { x:-2.8, z: 1.5, files:[C.fileBlue, C.fileYellow, C.fileRed] },
    { x: 7.5, z:-2.5, files:[C.fileRed, C.fileGreen, C.fileBlue, C.fileYellow, C.fileRed] },
  ];
  const offX = [0, 0.01, -0.01, 0.02, -0.01];
  const offZ = [0, 0.04, -0.05, 0.03, -0.04];
  return (
    <group>
      {stacks.map((s, si) => (
        <group key={si} position={[s.x, 0, s.z]}>
          {s.files.map((col, fi) => (
            <B key={fi} w={0.8} h={0.14} d={0.56}
              x={offX[fi]||0} y={0.07+fi*0.14} z={0}
              rz={offZ[fi]||0} c={col} />
          ))}
        </group>
      ))}
    </group>
  );
}

// ── CORNER PLANT ─────────────────────────────────────────────────────────────
function CornerPlant({ x, z, s=1 }: { x:number; z:number; s?:number }) {
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.24, 0.58, 8]} />
        <meshToonMaterial color={C.pot} />
        <Edges color="#0006" linewidth={1} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 8]} />
        <meshToonMaterial color="#1e0e04" />
      </mesh>
      <B w={0.07} h={1.4} d={0.07} x={0} y={1.32} z={0} c="#4a6a20" />
      <B w={0.95} h={0.07} d={0.6} x={ 0.28} y={1.55} z={ 0.1} c="#2d8a38" rx={ 0.18} rz={ 0.35} />
      <B w={0.85} h={0.07} d={0.55} x={-0.3}  y={1.78} z={ 0.08} c="#3a9a44" rx={-0.14} rz={-0.38} />
      <B w={0.8}  h={0.07} d={0.52} x={ 0.12} y={2.02} z={-0.14} c="#2a7a32" rx={ 0.32} rz={ 0.22} />
      <B w={0.9}  h={0.07} d={0.58} x={-0.22} y={2.28} z={ 0.1}  c="#3aaa46" rx={-0.24} rz={-0.28} />
      <B w={0.7}  h={0.07} d={0.46} x={ 0.18} y={2.52} z={-0.1}  c="#2a8a36" rx={ 0.28} rz={ 0.32} />
      <B w={0.55} h={0.07} d={0.38} x={-0.14} y={2.72} z={ 0.12} c="#3aaa42" rx={-0.2}  rz={-0.22} />
    </group>
  );
}

// ── WATER COOLER ─────────────────────────────────────────────────────────────
function WaterCooler() {
  return (
    <group position={[8.0, 0, 0.5]}>
      <B w={0.56} h={1.12} d={0.56} x={0} y={0.56} z={0} c="#b8d8ee" />
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.19, 0.21, 0.58, 8]} />
        <meshToonMaterial color="#a0d8f8" />
      </mesh>
      <mesh position={[0, 1.74, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
        <meshToonMaterial color="#2a80c0" />
      </mesh>
      <B w={0.11} h={0.09} d={0.11} x={-0.16} y={0.76} z={0.3} c="#c81818" />
      <B w={0.11} h={0.09} d={0.11} x={ 0.16} y={0.76} z={0.3} c="#1840c8" />
    </group>
  );
}

// ── FLYING PAPERS ────────────────────────────────────────────────────────────
function FlyingPapers() {
  const COUNT = 20;
  const paperRefs = useRef<(THREE.Mesh | null)[]>([]);
  const data = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      radius: 1.5 + Math.random() * 3.2,
      angle0: (i / COUNT) * Math.PI * 2 + Math.random() * 0.7,
      height0:0.6 + Math.random() * 3.8,
      speed:  (0.1 + Math.random() * 0.4) * (i%2===0 ? 1 : -1),
      vAmp:   0.15 + Math.random() * 0.4,
      vFreq:  0.3 + Math.random() * 0.7,
      phase:  Math.random() * Math.PI * 2,
      cx: (Math.random()-0.5)*4.5,
      cz:-1.5 + (Math.random()-0.5)*5,
      rsX:(Math.random()-0.5)*2, rsY:(Math.random()-0.5)*1.5, rsZ:(Math.random()-0.5)*2,
      r0X:Math.random()*Math.PI*2, r0Y:Math.random()*Math.PI*2,
    }))
  , []);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    data.forEach((p, i) => {
      const m = paperRefs.current[i]; if (!m) return;
      const a = p.angle0 + t * p.speed;
      m.position.x = p.cx + Math.cos(a) * p.radius;
      m.position.y = p.height0 + Math.sin(t*p.vFreq+p.phase)*p.vAmp;
      m.position.z = p.cz + Math.sin(a) * p.radius;
      m.rotation.x = p.r0X + t*p.rsX*0.5;
      m.rotation.y = p.r0Y + t*p.rsY*0.5;
      m.rotation.z = t*p.rsZ*0.5;
    });
  });
  return (
    <group>
      {data.map((_, i) => (
        <mesh key={i} ref={el => { paperRefs.current[i] = el; }}>
          <boxGeometry args={[0.4, 0.005, 0.52]} />
          <meshToonMaterial color={C.paper} side={THREE.DoubleSide} />
          <Edges color="#bbb" linewidth={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── ZONE ROOT ────────────────────────────────────────────────────────────────
export default function OfficeZone({ scrollProgress }: Props) {
  return (
    <group visible={scrollProgress < 0.35}>
      <Room />
      <CeilingFan />
      <NoticeBoard />
      <WallClock />
      <PortraitFrame />
      <FloorMat />
      <Desk />
      <Man />
      <FilingCabinets />
      <FileStacks />
      <CornerPlant x={-7.5} z={-7.5} />
      <CornerPlant x={ 7.5} z={-7.5} s={0.78} />
      <WaterCooler />
      <FlyingPapers />

      {/* LIGHTING — bright day office */}
      <pointLight position={[0, 7.5, -2]}  intensity={8}  color="#fffff0" distance={24} decay={1} />
      <pointLight position={[3, 4.2, -5]}  intensity={6}  color="#87ceeb" distance={14} decay={1.5} />
      <pointLight position={[0, 3.5,  8]}  intensity={5}  color="#ffffff" distance={18} decay={1.5} />
      <pointLight position={[-4, 5,   0]}  intensity={3}  color="#E8891A" distance={12} decay={2} />
      <pointLight position={[0, 4,   -2]}  intensity={4}  color="#fff8f0" distance={14} decay={1.5} />
    </group>
  );
}
