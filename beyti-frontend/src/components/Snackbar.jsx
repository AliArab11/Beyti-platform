import { X, CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

const Snackbar = ({ open, message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Small delay to trigger enter animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before removing from DOM
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  const icons = {
    success: <CheckCircle size={24} weight="fill" className="text-white" />,
    error: <XCircle size={24} weight="fill" className="text-white" />,
    warning: <WarningCircle size={24} weight="fill" className="text-white" />
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500'
  };

  return (
    <div 
      className="fixed z-[9999] transition-all duration-300 ease-out"
      style={{
        bottom: '24px',
        left: '50%',
        transform: isVisible 
          ? 'translateX(-50%) translateY(0)' 
          : 'translateX(-50%) translateY(120px)',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div 
        className={`${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[500px]`}
      >
        {icons[type]}
        <p className="font-semibold flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {message}
        </p>
        {onClose && (
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 rounded-full p-1 transition-all"
          >
            <X size={20} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Snackbar;