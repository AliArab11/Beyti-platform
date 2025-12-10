import { X, CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";

const Snackbar = ({ open, message, type = 'success', onClose }) => {
  if (!open) return null;

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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]"
      style={{
        animation: 'slideUp 0.3s ease-out forwards'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
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