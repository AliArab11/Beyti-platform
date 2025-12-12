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

  // Parse the date string correctly - handle both formats
  // Parse the date string correctly
    const dateStr = order.createdAt;
    let orderTime;

    if (dateStr.endsWith('Z')) {
    // Already in UTC format with Z suffix
    orderTime = new Date(dateStr);
    } else if (dateStr.includes('T') && !dateStr.includes('+') && !dateStr.endsWith('Z')) {
    // ISO format without timezone (backend sends UTC but without Z)
    // Add 'Z' to treat it as UTC
    orderTime = new Date(dateStr + 'Z');
    } else {
    // Other format - try parsing as-is
    orderTime = new Date(dateStr);
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

    // Only trigger onExpire if we've been actively counting down
    if (diff <= 0 && !hasExpiredRef.current) {
      console.log('⏰ Timer reached zero, triggering auto-cancel for order:', order.id);
      setIsExpired(true);
      hasExpiredRef.current = true;
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
    if (seconds <= 60) return 'text-red-600 font-bold'; // Under 1 minute
    if (seconds <= 300) return 'text-orange-500 font-semibold'; // Under 5 minutes
    return 'text-charcoal-600'; // Normal
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    colorClass: getColorClass(timeLeft),
    isExpired
  };
};