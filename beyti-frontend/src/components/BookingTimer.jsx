import { useState, useEffect, useRef } from 'react';
import { Clock } from '@phosphor-icons/react';

/**
 * BookingTimer Component
 *
 * A reusable countdown timer for service bookings
 * Shows time remaining until auto-cancellation
 *
 * @param {Date} createdAt - When the booking was created
 * @param {number} durationMinutes - Timer duration in minutes (default: 1)
 * @param {function} onExpire - Callback when timer reaches 0
 * @param {boolean} compact - If true, shows minimal UI
 */
export default function BookingTimer({ createdAt, durationMinutes = 1, onExpire, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = useRef(onExpire);

  // Keep the ref updated with the latest onExpire callback
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const created = new Date(createdAt);
      const expiresAt = new Date(created.getTime() + durationMinutes * 60 * 1000);
      const difference = expiresAt - now;

      if (difference <= 0) {
        if (!isExpired) {
          setIsExpired(true);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
        return null;
      }

      const seconds = Math.floor((difference / 1000) % 60);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);

      return { minutes, seconds, total: difference };
    };

    // Calculate initial time
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, durationMinutes, isExpired]);

  if (isExpired) {
    return compact ? (
      <span className="text-error-text text-label-small font-semibold">Expired</span>
    ) : (
      <div className="flex items-center gap-2 px-3 py-2 bg-error-bg rounded-lg border border-error-border">
        <Clock size={16} className="text-error-text" weight="bold" />
        <span className="text-error-text text-label-small font-semibold">Time Expired</span>
      </div>
    );
  }

  if (!timeLeft) {
    return compact ? (
      <span className="text-charcoal-400 text-label-small">Loading...</span>
    ) : (
      <div className="flex items-center gap-2 px-3 py-2 bg-grey-100 rounded-lg">
        <Clock size={16} className="text-charcoal-400" />
        <span className="text-charcoal-400 text-label-small">Loading...</span>
      </div>
    );
  }

  const isUrgent = timeLeft.total < 30000; // Less than 30 seconds

  if (compact) {
    return (
      <span className={`font-mono text-label-small font-bold ${
        isUrgent ? 'text-error-text' : 'text-warning-text'
      }`}>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      isUrgent
        ? 'bg-error-bg border-error-border'
        : 'bg-warning-bg border-warning-border'
    }`}>
      <Clock size={16} className={isUrgent ? 'text-error-text' : 'text-warning-text'} weight="bold" />
      <span className={`font-mono text-label-medium font-bold ${
        isUrgent ? 'text-error-text' : 'text-warning-text'
      }`}>
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
      <span className={`text-label-small ${
        isUrgent ? 'text-error-text' : 'text-warning-text'
      }`}>
        remaining
      </span>
    </div>
  );
}
