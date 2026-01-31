import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

const Stars = (props) => {
  const ref = useRef();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 2.5 }));

  useFrame((state, delta) => {
    // Rotation
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;

    // Boom Logic: Animate the GROUP scale
    ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 1, delta * 2);
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 1, delta * 2);
    ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 1, delta * 2);
  });

  return (
    // Initial scale set to 0 via ref (or could use prop, but removing prop lets ref take control after mount if we set it)
    // Actually, setting scale prop to [0,0,0] is fine IF we animate THIS group's ref.
    <group ref={ref} rotation={[0, 0, Math.PI / 4]} scale={[0, 0, 0]}>
      <Points positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#f28c28"
          size={0.005} // Visible size
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

// Alternative: Tech Grid Wave
const Wave = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[50, 50, 50, 50]} />
            <meshBasicMaterial color="#f28c28" wireframe transparent opacity={0.1} />
        </mesh>
    )
}


const ParticleWave = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
      </Canvas>
    </div>
  );
};


export default ParticleWave;
