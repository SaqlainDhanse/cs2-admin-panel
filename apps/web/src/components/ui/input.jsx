
import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-700 bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF41] focus:border-[#00FF41] focus:shadow-[0_0_10px_rgba(0,255,65,0.5)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
