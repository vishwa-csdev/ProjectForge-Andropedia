import React from 'react';

const Input = ({ label, id, type = 'text', as = 'input', textarea = false, className = '', ...props }) => {
  const Component = textarea ? 'textarea' : as;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const baseClasses = 'app-input bg-base/80 border border-white/15 rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/80 placeholder-text-muted w-full transition-all shadow-inner';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-mono uppercase tracking-wider text-text-secondary font-medium">
          {label}
        </label>
      )}
      <Component 
        id={inputId}
        type={as === 'input' ? type : undefined}
        className={`${baseClasses} ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
