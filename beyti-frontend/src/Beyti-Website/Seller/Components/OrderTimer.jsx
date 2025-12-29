import React from 'react';
import { useOrderTimer } from './useOrderTimer';
import { Clock } from '@phosphor-icons/react';

const OrderTimer = ({ order, onExpire, showIcon = true, size = 'medium' }) => {
  const { formattedTime, colorClass, isExpired } = useOrderTimer(order, onExpire);

  if (!formattedTime || isExpired) return null;

  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center gap-1.5 ${colorClass} ${sizeClasses[size]}`}>
      {showIcon && <Clock size={size === 'small' ? 14 : 16} weight="fill" />}
      <span className="font-mono">{formattedTime}</span>
    </div>
  );
};

export default OrderTimer;