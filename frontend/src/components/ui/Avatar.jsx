import React from 'react';

const Avatar = ({ name, size = 'md', className = '' }) => {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  
  // Hash name to pick a color
  const colors = [
    'bg-blue-900 text-blue-200',
    'bg-purple-900 text-purple-200',
    'bg-pink-900 text-pink-200',
    'bg-indigo-900 text-indigo-200',
    'bg-teal-900 text-teal-200',
    'bg-green-900 text-green-200',
    'bg-yellow-900 text-yellow-200',
    'bg-red-900 text-red-200',
  ];
  
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const colorClass = colors[colorIndex];

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={`flex items-center justify-center rounded-full font-semibold ${colorClass} ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
};

export default Avatar;
