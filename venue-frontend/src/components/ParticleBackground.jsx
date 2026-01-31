import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

const ParticleField = (props) => {
  const ref = useRef();
  
  const count = 1500;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Spread out more for ambient feel
        positions[i * 3] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    // Very slow rotation
    ref.current.rotation.x -= delta / 30;
    ref.current.rotation.y -= delta / 40;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#334155" // Slate-700, very subtle blue-grey
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.3} // Low opacity
        />
      </Points>
    </group>
  );
};

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30 bg-bgPrimary">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleField />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
