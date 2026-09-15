import React, { useState } from 'react';

const BrandMark = ({ className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-gray-950 font-bold font-mono text-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] ${className}`}>
      {!imageFailed ? (
        <img src="/test.jpg" alt="Andropedia" className="w-full h-full object-cover" onError={() => setImageFailed(true)} />
      ) : 'AH'}
    </div>
  );
};

export default BrandMark;