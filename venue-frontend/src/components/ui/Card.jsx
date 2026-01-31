import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className, hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : {}}
      className={twMerge(
        "bg-bgCard border border-borderSubtle rounded-xl p-6 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
