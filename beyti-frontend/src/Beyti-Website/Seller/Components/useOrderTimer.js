import { useState, useEffect, useCallback, useRef } from 'react';

export const useOrderTimer = (order, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const hasExpiredRef = useRef(false);
  const initialCheckRef = useRef(true);

  const calculateTimeLeft = useCallback(() => {
    if (!order || !order.createdAt) return null;
    
    const status = order.status?.toLowerCase();
    if (!['placed', 'pending'].includes(status)) return null;

    // Parse the date string as LOCAL time, not UTC
    const dateStr = order.createdAt;
    let orderTime;

    // Remove any 'Z' suffix to prevent UTC parsing
    const cleanDateStr = dateStr.replace('Z', '');
    
    // Parse as local time by removing timezone indicators
    if (cleanDateStr.includes('T')) {
      // Split date and time parts
      const [datePart, timePart] = cleanDateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(s => parseFloat(s));
      
      // Create date in local timezone
      orderTime = new Date(year, month - 1, day, hours, minutes, seconds);
    } else {
      // Fallback for other formats
      orderTime = new Date(cleanDateStr);
    }
    
    const expiryTime = new Date(orderTime.getTime() + 1 * 60 * 1000);
    const now = new Date();
    const diff = expiryTime - now;

    // On initial load, if already expired, don't trigger cancellation
    if (initialCheckRef.current) {
      initialCheckRef.current = false;
      if (diff <= 0) {
        console.log('⚠️ Order already expired on load, not triggering auto-cancel');
        setIsExpired(true);
        hasExpiredRef.current = true;
        return 0;
      }
    }

    // Timer just hit zero - trigger cancellation
    if (diff <= 0 && !hasExpiredRef.current) {
      console.log('⏰ Timer reached zero, triggering cancellation for order:', order.id);
      setIsExpired(true);
      hasExpiredRef.current = true;
      
      // Call the onExpire callback
      if (onExpire) {
        onExpire(order.id);
      }
      return 0;
    }

    if (diff <= 0) {
      return 0;
    }

    return Math.floor(diff / 1000); // seconds
  }, [order, onExpire]);

  useEffect(() => {
    // Reset refs when order changes
    hasExpiredRef.current = false;
    initialCheckRef.current = true;
    
    const seconds = calculateTimeLeft();
    setTimeLeft(seconds);

    if (seconds === null || seconds === 0) return;

    const interval = setInterval(() => {
      const newSeconds = calculateTimeLeft();
      setTimeLeft(newSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, order?.id]);

  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (seconds) => {
    if (seconds === null) return '';
    if (seconds <= 60) return 'text-red-600 font-bold';
    if (seconds <= 300) return 'text-orange-500 font-semibold';
    return 'text-charcoal-600';
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    colorClass: getColorClass(timeLeft),
    isExpired
  };
};