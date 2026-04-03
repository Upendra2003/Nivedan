import { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Drop screenshots as public/screenshots/s0.png … s6.png
// ─────────────────────────────────────────────────────────────────────────────
const SCREENSHOTS = [
  '/screenshots/s0.png',
  '/screenshots/s1.png',
  '/screenshots/s2.png',
  '/screenshots/s3.png',
  '/screenshots/s4.png',
  '/screenshots/s5.png',
  '/screenshots/s6.png',
];

const TARGET_X = [1.5, 1.5, -1.5, 1.5, -1.5, 1.5, -1.5];

interface Props { section: number }

// ── Screenshot plane overlay (always works, regardless of GLB mesh names) ─────
function ScreenPlane({
  visibleSection, z, w, h,
}: { visibleSection: number; z: number; w: number; h: number }) {
  const textures = useTexture(SCREENSHOTS);
  const matRef   = useRef<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {
    const tex = textures[Math.min(visibleSection, textures.length - 1)];
    // Cover-fit: crop to fill without letterboxing
    if (tex.image && w && h) {
      const screenAR = w / h;
      const imgAR    = tex.image.width / tex.image.height;
      if (imgAR > screenAR) {
        const s = imgAR / screenAR;
        tex.repeat.set(1 / s, 1);
        tex.offset.set((1 - 1 / s) / 2, 0);
      } else {
        const s = screenAR / imgAR;
        tex.repeat.set(1, 1 / s);
        tex.offset.set(0, (1 - 1 / s) / 2);
      }
      tex.needsUpdate = true;
    }
    if (matRef.current) {
      matRef.current.map = tex;
      matRef.current.needsUpdate = true;
    }
  }, [visibleSection, textures, w, h]);

  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial
        ref={matRef}
        map={textures[0]}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── GLB phone shell ───────────────────────────────────────────────────────────
function IPhoneGLB({ visibleSection }: { visibleSection: number }) {
  const { scene } = useGLTF('/PhoneModel3D.glb');

  const { clonedScene, screenZ, screenW, screenH } = useMemo(() => {
    const clone = scene.clone(true);

    // Scale to 2.2 units tall
    const box  = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const s    = size.y > 0 ? 2.2 / size.y : 1;
    clone.scale.setScalar(s);

    // Re-center
    const cbox   = new THREE.Box3().setFromObject(clone);
    const center = cbox.getCenter(new THREE.Vector3());
    clone.position.sub(center);

    // Measure final bounds → derive screen overlay size + position
    const fb  = new THREE.Box3().setFromObject(clone);
    const fs  = fb.getSize(new THREE.Vector3());

    // iPhone screen covers ~88% height, ~85% width of the body
    const sH = fs.y * 0.84;
    const sW = fs.x * 0.82;
    // Place the plane just above the front face of the phone
    const sZ = fb.max.z + 0.003;

    return { clonedScene: clone, screenZ: sZ, screenW: sW, screenH: sH };
  }, [scene]);

  return (
    <>
      <primitive object={clonedScene} />
      <ScreenPlane visibleSection={visibleSection} z={screenZ} w={screenW} h={screenH} />
    </>
  );
}

function Fallback() {
  return (
    <mesh>
      <boxGeometry args={[1.1, 2.2, 0.11]} />
      <meshStandardMaterial color="#1A1A2E" />
    </mesh>
  );
}

// ── Main phone group (drag / parallax / section slide) ────────────────────────
export default function PhoneModel({ section }: Props) {
  const groupRef       = useRef<THREE.Group>(null);
  const screenLightRef = useRef<THREE.PointLight>(null);

  // Intro spin: 2 full Y rotations → settle on front face
  const introProgress = useRef(0);   // 0 → 1 over INTRO_DURATION seconds
  const introDone     = useRef(false);
  const INTRO_DURATION = 2.4;        // seconds

  // Slide animation
  const slideRef   = useRef(1);
  const fromX      = useRef(TARGET_X[0]);
  const toX        = useRef(TARGET_X[0]);
  const swapped    = useRef(true);
  const pendingSec = useRef(0);
  const [visibleSection, setVisibleSection] = useState(0);

  // Section-change spin (360° Y)
  const spinProgress = useRef(0);
  const spinActive   = useRef(false);
  const SPIN_DURATION = 0.72; // seconds for one full 360°

  // Drag
  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const userRotY   = useRef(0);
  const userRotX   = useRef(0);
  const velY       = useRef(0);
  const velX       = useRef(0);

  // Parallax
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    if (!groupRef.current) return;
    fromX.current      = groupRef.current.position.x;
    toX.current        = TARGET_X[Math.min(section, TARGET_X.length - 1)];
    pendingSec.current = section;
    slideRef.current   = 0;
    swapped.current    = false;
    // Trigger 360° spin on each section change (skip during intro)
    if (introDone.current) {
      spinProgress.current = 0;
      spinActive.current   = true;
    }
  }, [section]);

  const onPointerDown = (e: any) => {
    if (!introDone.current) return;   // block drag during intro spin
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current  = { x: e.clientX, y: e.clientY };
    velY.current = velX.current = 0;
    document.body.style.cursor = 'grabbing';

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      velY.current = dx * 0.006;
      velX.current = dy * 0.006;
      userRotY.current = THREE.MathUtils.clamp(userRotY.current + velY.current, -Math.PI * 0.9, Math.PI * 0.9);
      userRotX.current = THREE.MathUtils.clamp(userRotX.current + velX.current, -Math.PI / 3, Math.PI / 3);
      dragStart.current = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // ── Intro spin (2 full rotations → front face) ────────────────────────────
    if (!introDone.current) {
      introProgress.current = Math.min(introProgress.current + delta / INTRO_DURATION, 1);
      const p = introProgress.current;
      // Ease-out quart: fast spin, gradual settle
      const eased = 1 - Math.pow(1 - p, 4);
      // Start 2 full rotations away (4π), land at 0 (front)
      groupRef.current.rotation.y = (1 - eased) * Math.PI * 4;
      groupRef.current.rotation.x = 0.055;
      groupRef.current.rotation.z = 0;
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.09;
      groupRef.current.position.x = TARGET_X[0];
      if (screenLightRef.current) screenLightRef.current.intensity = 0.9;
      if (p >= 1) introDone.current = true;
      return;
    }

    // Slide
    const sliding = slideRef.current < 1;
    if (sliding) {
      slideRef.current = Math.min(slideRef.current + delta * 1.6, 1);
      if (slideRef.current >= 0.5 && !swapped.current) {
        swapped.current = true;
        setVisibleSection(pendingSec.current);
      }
    }
    const ap    = slideRef.current;
    const eased = ap < 1 ? ap * ap * (3 - 2 * ap) : 1;
    groupRef.current.position.x = THREE.MathUtils.lerp(fromX.current, toX.current, eased);
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.09;
    groupRef.current.rotation.z = Math.sin(t * 0.55) * 0.016;

    // Drag + spring-back
    if (!isDragging.current) {
      userRotY.current = THREE.MathUtils.clamp(userRotY.current + velY.current, -Math.PI * 0.9, Math.PI * 0.9);
      userRotX.current = THREE.MathUtils.clamp(userRotX.current + velX.current, -Math.PI / 3, Math.PI / 3);
      velY.current *= 0.88;
      velX.current *= 0.88;
      userRotY.current = THREE.MathUtils.lerp(userRotY.current, 0, 0.05);
      userRotX.current = THREE.MathUtils.lerp(userRotX.current, 0, 0.05);
    }

    // Section-change spin (360° Y rotation)
    if (spinActive.current) {
      spinProgress.current += delta / SPIN_DURATION;
      if (spinProgress.current >= 1) {
        spinProgress.current = 0;
        spinActive.current   = false;
      }
    }
    // Ease-in-out curve so spin accelerates then decelerates
    const sp = spinProgress.current;
    const spinEased = sp < 0.5 ? 2 * sp * sp : 1 - Math.pow(-2 * sp + 2, 2) / 2;
    const spinAngle = spinActive.current ? spinEased * Math.PI * 2 : 0;

    // Parallax
    const py = isDragging.current ? 0 : mouseX.current * 0.12;
    const px = isDragging.current ? 0 : -mouseY.current * 0.07;
    groupRef.current.rotation.y = userRotY.current + py + spinAngle;
    groupRef.current.rotation.x = 0.055 + userRotX.current + px;

    if (screenLightRef.current) {
      screenLightRef.current.intensity = THREE.MathUtils.lerp(
        screenLightRef.current.intensity, sliding ? 2.8 : 0.9, 0.1,
      );
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerEnter={() => { document.body.style.cursor = 'grab'; }}
      onPointerLeave={() => { if (!isDragging.current) document.body.style.cursor = ''; }}
    >
      <Suspense fallback={<Fallback />}>
        <IPhoneGLB visibleSection={visibleSection} />
      </Suspense>

      <pointLight ref={screenLightRef} position={[0, 0, 0.6]} color="#ffffff" intensity={0.9} distance={3} decay={2} />
      <pointLight position={[0, 0, -1.2]} color="#3B5998" intensity={0.5} distance={2.5} decay={2} />
    </group>
  );
}

useGLTF.preload('/PhoneModel3D.glb');
