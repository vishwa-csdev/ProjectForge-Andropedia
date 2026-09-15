import React from 'react';

const Badge = ({ type, variant, children, className = '' }) => {
  const variants = {
    // Task Statuses
    todo: 'bg-white/5 text-text-secondary border border-white/10',
    in_progress: 'bg-accent/15 text-accent border border-accent/30',
    blocked: 'bg-danger/15 text-danger border border-danger/30',
    done: 'bg-success/15 text-success border border-success/30',
    // Priorities
    low: 'bg-white/5 text-text-secondary border border-white/10',
    medium: 'bg-accent/15 text-accent border border-accent/30',
    high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    urgent: 'bg-danger/20 text-danger border border-danger/40 glow-danger',
    // Member roles & telemetry
    lead: 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 glow-cyan',
    member: 'bg-white/5 text-text-secondary border border-white/10',
    admin: 'bg-accent/15 text-accent border border-accent/35',
    active: 'bg-success/15 text-success border border-success/30',
    archived: 'bg-white/5 text-text-muted border border-white/5',
  };

  const styleClass = variants[variant] || variants[type] || 'bg-white/5 text-text-secondary border border-white/10';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase whitespace-nowrap transition-colors ${styleClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
