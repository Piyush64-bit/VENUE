import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionValue, useVelocity, useAnimationFrame } from "framer-motion";
import { wrap } from "@motionone/utils";

const Marquee = ({ children, baseVelocity = 100, pauseOnHover = false }) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });

  const x = useTransform(baseX, (v) => `${wrap(-45, -20, v)}%`);

  const directionFactor = useRef(1);
  const isPaused = useRef(false);
  const isDragging = useRef(false);

  useAnimationFrame((t, delta) => {
    if (isPaused.current || isDragging.current) return;

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <motion.div 
      className="overflow-hidden m-0 flex flex-nowrap whitespace-nowrap cursor-grab active:cursor-grabbing touch-pan-y"
      onMouseEnter={() => pauseOnHover && (isPaused.current = true)}
      onMouseLeave={() => pauseOnHover && (isPaused.current = false)}
      onPanStart={() => { isDragging.current = true; }}
      onPanEnd={() => { isDragging.current = false; }}
      onPan={(_, info) => {
        // Adjust sensitivity: 0.05 means 1px drag = 0.05% scroll
        // Reduce speed for finer control
        baseX.set(baseX.get() + info.delta.x * 0.05);
      }}
    >
      <motion.div className="flex flex-nowrap whitespace-nowrap gap-8" style={{ x, willChange: 'transform' }}>
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Marquee;
