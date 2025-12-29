import React from 'react';
import { X, Warning, CheckCircle, Info } from '@phosphor-icons/react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'danger' // 'danger', 'success', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: <Warning size={48} weight="fill" className="text-error-btn" />,
      buttonClass: 'bg-error-btn hover:bg-error-text'
    },
    success: {
      icon: <CheckCircle size={48} weight="fill" className="text-success-btn" />,
      buttonClass: 'bg-success-btn hover:bg-success-text'
    },
    warning: {
      icon: <Warning size={48} weight="fill" className="text-danger-btn" />,
      buttonClass: 'bg-danger-btn hover:bg-danger-text text-charcoal-600'
    },
    info: {
      icon: <Info size={48} weight="fill" className="text-sage-500" />,
      buttonClass: 'bg-sage-500 hover:bg-sage-600'
    }
  };

  const config = variantConfig[variant] || variantConfig.danger;

  return (
    <div className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-cream-50 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-grey-stroke flex justify-between items-start">
          <div className="flex items-start gap-4">
            {config.icon}
            <h3 className="text-card-h2 text-charcoal-600 font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600">
            <X size={24} weight="bold" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-body-regular text-charcoal-600">{message}</p>
        </div>
        <div className="p-6 border-t border-grey-stroke flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-grey-200 text-charcoal-600 text-button font-semibold rounded-xl hover:bg-grey-300 border border-grey-stroke">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-6 py-2.5 ${config.buttonClass} text-white text-button font-semibold rounded-xl shadow-soft-lift`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;