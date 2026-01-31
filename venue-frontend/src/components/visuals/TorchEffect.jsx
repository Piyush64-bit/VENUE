import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const TorchEffect = () => {
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for the torch lag
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 250); // Center the 500px gradients
      mouseY.set(e.clientY - 250);
      setIsHovering(true);
    };

    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed inset-0 z-30 pointer-events-none mix-blend-soft-light"
      style={{
        background: `radial-gradient(600px circle at ${x.get() + 250}px ${y.get() + 250}px, rgba(255,255,255,0.15), transparent 40%)`,
        opacity: isHovering ? 1 : 0,
      }}
    />
  );
};

export default TorchEffect;
