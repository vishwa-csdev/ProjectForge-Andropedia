import React from 'react';

const DeadlineBadge = ({ dateString }) => {
  if (!dateString) return null;

  const deadline = new Date(dateString);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formattedDate = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  let styleClass = 'text-text-secondary';
  let label = formattedDate;

  if (diffDays < 0) {
    styleClass = 'text-danger glow-danger px-2 py-0.5 rounded-md bg-danger/10';
    label = 'Overdue';
  } else if (diffDays <= 3) {
    styleClass = 'text-accent glow-amber px-2 py-0.5 rounded-md bg-accent/10';
    label = `${diffDays}d left`;
  }

  return (
    <span className={`text-xs font-mono font-medium ${styleClass}`}>
      {label}
    </span>
  );
};

export default DeadlineBadge;
