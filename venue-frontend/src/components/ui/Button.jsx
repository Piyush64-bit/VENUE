import { motion } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading, 
  disabled, 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-medium transition-colors rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bgPrimary disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accentOrange text-white hover:bg-accentHover shadow-[0_0_20px_rgba(242,140,40,0.3)] hover:shadow-[0_0_25px_rgba(242,140,40,0.5)] focus:ring-accentOrange",
    secondary: "bg-bgCard text-textPrimary border border-borderSubtle hover:border-accentOrange/50 focus:ring-bgCard",
    ghost: "bg-transparent text-textMuted hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={twMerge(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};
