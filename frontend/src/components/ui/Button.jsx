import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = 'app-button inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060A]';
  
  const variants = {
    primary: 'bg-accent text-gray-950 font-semibold hover:brightness-110 glow-amber border border-amber-300/40 shadow-sm',
    cyan: 'bg-cyan text-gray-950 font-semibold hover:brightness-110 glow-cyan border border-cyan-300/40 shadow-sm',
    secondary: 'bg-surface/80 backdrop-blur-xs border border-white/10 text-text-primary hover:bg-elevated hover:border-cyan-400/40 hover:text-white',
    danger: 'bg-danger/20 border border-danger/40 text-danger hover:bg-danger hover:text-white glow-danger',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-mono min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-2.5 text-base min-h-[44px]',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
