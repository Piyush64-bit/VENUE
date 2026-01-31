import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-textMuted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={twMerge(
          "w-full px-4 py-3 bg-bgSecondary border border-borderSubtle rounded-xl text-textPrimary placeholder:text-textMuted/50 outline-none transition-all duration-200 focus:border-accentOrange focus:ring-1 focus:ring-accentOrange",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
