import { Canvas } from "@react-three/fiber";
import CameraRig   from "./CameraRig";
import OfficeZone  from "./OfficeZone";
import PhoneReveal from "./PhoneReveal";
import NivedanZone from "./NivedanZone";
import Dashboard3D from "./Dashboard3D";

interface SceneProps { scrollProgress: number }

export default function Scene({ scrollProgress }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [4, 2.0, 8], fov: 62 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#b8d4f0"]} />
      <fog attach="fog" args={["#c8dff5", 20, 48]} />

      <ambientLight intensity={2.5} color="#ffffff" />
      <hemisphereLight args={["#87ceeb", "#d4a96a", 1.5]} />
      <directionalLight position={[8, 12, 10]} intensity={3} color="#fff8f0" />

      <CameraRig    scrollProgress={scrollProgress} />
      <OfficeZone   scrollProgress={scrollProgress} />
      <PhoneReveal  scrollProgress={scrollProgress} />
      <NivedanZone  scrollProgress={scrollProgress} />
      <Dashboard3D  scrollProgress={scrollProgress} />
    </Canvas>
  );
}
