import React from 'react';

const Card = ({ children, elevated = false, statusColor = null, className = '', ...props }) => {
  const edgeClasses = {
    accent: 'card-edge-active',
    cyan: 'card-edge-cyan',
    archived: 'card-edge-archived',
    danger: 'card-edge-danger',
    success: 'card-edge-success',
  };

  let statusClass = '';
  if (statusColor) {
    statusClass = edgeClasses[statusColor] || '';
  }

  const surfaceClass = elevated ? 'hud-card-elevated' : 'hud-card';

  return (
    <div 
      className={`${surfaceClass} app-card rounded-xl p-5 relative overflow-hidden transition-all duration-200 ${statusClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
