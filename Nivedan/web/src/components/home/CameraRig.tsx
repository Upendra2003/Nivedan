import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props { scrollProgress: number }

// [progress, camX, camY, camZ, lookX, lookY, lookZ]
const KF = [
  [0.00,  4.0, 2.0,  8.0,   0.0, 1.2, -0.5],  // office — eye-level wide right
  [0.25,  0.0, 3.5, 11.0,   0.0, 3.2, -1.0],  // pull back — phone framed center
  [0.47,  1.5, 3.0,  9.5,  -1.0, 2.8, -4.5],  // section 1 — camera right, sees left phone
  [0.63, -1.5, 3.0,  9.5,   1.0, 2.8, -4.5],  // section 2 — camera left, sees right phone
  [0.78,  0.0, 4.5, 10.0,   0.0, 3.5, -5.5],  // sections 3-4 — wide centered
  [1.00,  0.0, 4.5, 10.0,   0.0, 3.5, -5.5],  // CTA — settled
];

const _pos  = new THREE.Vector3();
const _look = new THREE.Vector3();

export default function CameraRig({ scrollProgress }: Props) {
  const { camera } = useThree();

  useFrame(() => {
    // find surrounding keyframe pair
    let i = 0;
    for (let j = 0; j < KF.length - 1; j++) {
      if (scrollProgress >= KF[j][0]) i = j;
    }
    const from = KF[i];
    const to   = KF[Math.min(i + 1, KF.length - 1)];
    const span = to[0] - from[0];
    const t    = span > 0 ? THREE.MathUtils.clamp((scrollProgress - from[0]) / span, 0, 1) : 0;
    const st   = t * t * (3 - 2 * t); // smoothstep easing

    _pos.set(
      THREE.MathUtils.lerp(from[1], to[1], st),
      THREE.MathUtils.lerp(from[2], to[2], st),
      THREE.MathUtils.lerp(from[3], to[3], st),
    );
    _look.set(
      THREE.MathUtils.lerp(from[4], to[4], st),
      THREE.MathUtils.lerp(from[5], to[5], st),
      THREE.MathUtils.lerp(from[6], to[6], st),
    );

    camera.position.lerp(_pos, 0.06);
    camera.lookAt(_look);
  });

  return null;
}
