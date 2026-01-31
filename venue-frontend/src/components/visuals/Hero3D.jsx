import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, PerformanceMonitor } from '@react-three/drei';

const FloatingShape = (props) => {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.cos(t / 4) / 2;
    meshRef.current.rotation.y = Math.sin(t / 4) / 2;
    meshRef.current.position.y = Math.sin(t / 1.5) / 10;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5} {...props}>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
           color="#F28C28" 
           roughness={0.1}
           metalness={1}
        />
      </mesh>
    </Float>
  );
};

const Hero3D = () => {
  const [dpr, setDpr] = useState(1.5);
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 45 }}>
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <FloatingShape position={[3, 0, 0]} scale={1.2} />
        <FloatingShape position={[-3, 2, -2]} scale={0.8} />
        <FloatingShape position={[0, -2, -1]} scale={1.5} />
      </Canvas>
    </div>
  );
};

export default Hero3D;
