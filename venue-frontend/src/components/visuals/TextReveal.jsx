import { motion } from "framer-motion";

const TextReveal = ({ children, className, delay = 0 }) => {
  // Split text into words, then characters
  // For simplicity, we just wrap the whole string in a container and animate chars if passed as string
  // But usually for "The Collection", we want word or char stagger.
  
  // If children is a string, split it.
  const text = typeof children === "string" ? children : "";

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 * i + delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h1
      style={{ display: "flex", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {text.split("").map((char, index) => (
        <motion.span variants={child} key={index}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export default TextReveal;
