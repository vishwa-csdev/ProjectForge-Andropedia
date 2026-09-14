import React from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen = true, onClose, title, children }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (isOpen === false) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="hud-card-elevated rounded-2xl w-full max-w-lg border border-cyan-400/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/[0.02]">
          <h2 id="modal-title" className="font-display text-lg font-bold text-text-primary tracking-wide">{title}</h2>
          <button 
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-cyan-300 hover:bg-white/5 transition-colors cursor-pointer text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
