import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment } from '@react-three/drei';
import PhoneModel from './PhoneModel';

interface Props {
  section: number;
  center?: boolean; // force phone to X=0 (used by mobile layout)
}

export default function PhoneScene({ section, center }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.6], fov: 44 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight     intensity={0.7}  color="#e8f0ff" />
      <directionalLight intensity={1.2}  color="#ffffff" position={[2.5, 3.5, 2]} />
      <pointLight       intensity={0.45} color="#E8891A" position={[-3, 0.5, 2]} distance={8} decay={2} />
      <pointLight       intensity={0.2}  color="#3B5998" position={[0, -1, -3]}  distance={6} decay={2} />

      <Suspense fallback={null}>
        <PhoneModel section={section} center={center} />
        <ContactShadows position={[0, -1.35, 0]} opacity={0.18} scale={4.5} blur={5} far={2} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
