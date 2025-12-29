import { useEffect, useCallback } from 'react';
import { useSignalR } from '../contexts/SignalRContext';

export const useSignalRNotifications = ({
  onNotification,
  onUnreadCountUpdate,
  onOrderUpdate,
  onOrderStatusChange,
  onBookingUpdate,
  onBookingStatusChange,
  onProductUpdate,
  onCategoryUpdate,
  onServiceUpdate,
  onAnnouncement
}) => {
  const { on, off, isConnected } = useSignalR();

  // Stabilize handlers with useCallback to prevent re-registration
  const handleNotification = useCallback((notification) => {
    console.log('[SignalR] Received notification:', notification);
    if (onNotification) {
      onNotification(notification);
    }
  }, [onNotification]);

  const handleUnreadCountUpdate = useCallback((count) => {
    console.log('[SignalR] Unread count update:', count);
    if (onUnreadCountUpdate) {
      onUnreadCountUpdate(count);
    }
  }, [onUnreadCountUpdate]);

  const handleOrderUpdate = useCallback((data) => {
    console.log('[SignalR] 🔔🔔🔔 RAW Order Update Event Received!');
    console.log('[SignalR] Event data:', data);
    console.log('[SignalR] Event type:', typeof data);
    console.log('[SignalR] Event keys:', Object.keys(data || {}));
    console.log('[SignalR] Full JSON:', JSON.stringify(data, null, 2));

    if (onOrderUpdate) {
      console.log('[SignalR] ✅ Calling onOrderUpdate callback...');
      onOrderUpdate(data);
    } else {
      console.warn('[SignalR] ⚠️ No onOrderUpdate callback registered!');
    }
  }, [onOrderUpdate]);

  const handleOrderStatusChange = useCallback((data) => {
    console.log('[SignalR] Order status change:', data);
    if (onOrderStatusChange) {
      onOrderStatusChange(data);
    }
  }, [onOrderStatusChange]);

  const handleBookingUpdate = useCallback((data) => {
    console.log('[SignalR] Booking update:', data);
    if (onBookingUpdate) {
      onBookingUpdate(data);
    }
  }, [onBookingUpdate]);

  const handleBookingStatusChange = useCallback((data) => {
    console.log('[SignalR] Booking status change:', data);
    if (onBookingStatusChange) {
      onBookingStatusChange(data);
    }
  }, [onBookingStatusChange]);

  const handleProductUpdate = useCallback((data) => {
    console.log('[SignalR] Product update:', data);
    if (onProductUpdate) {
      onProductUpdate(data);
    }
  }, [onProductUpdate]);

  const handleCategoryUpdate = useCallback((data) => {
    console.log('[SignalR] Category update:', data);
    if (onCategoryUpdate) {
      onCategoryUpdate(data);
    }
  }, [onCategoryUpdate]);

  const handleServiceUpdate = useCallback((data) => {
    console.log('[SignalR] Service update:', data);
    if (onServiceUpdate) {
      onServiceUpdate(data);
    }
  }, [onServiceUpdate]);

  const handleAnnouncement = useCallback((data) => {
    console.log('[SignalR] Announcement:', data);
    if (onAnnouncement) {
      onAnnouncement(data);
    }
  }, [onAnnouncement]);

  // Register/unregister notification handler
  // Note: SignalR JS client converts event names to lowercase automatically
  useEffect(() => {
    if (!isConnected || !onNotification) return;
    on('receivenotification', handleNotification);
    return () => off('receivenotification', handleNotification);
  }, [isConnected, onNotification, on, off, handleNotification]);

  // Register/unregister unread count handler
  useEffect(() => {
    if (!isConnected || !onUnreadCountUpdate) return;
    on('receiveunreadcountupdate', handleUnreadCountUpdate);
    return () => off('receiveunreadcountupdate', handleUnreadCountUpdate);
  }, [isConnected, onUnreadCountUpdate, on, off, handleUnreadCountUpdate]);

  // Register/unregister order update handler
  useEffect(() => {
    if (!isConnected || !onOrderUpdate) {
      console.log('[SignalR] ⚠️ Order update handler NOT registered - isConnected:', isConnected, 'onOrderUpdate:', !!onOrderUpdate);
      return;
    }

    console.log('[SignalR] ✅ Registering order update handler for event: receiveorderupdate');
    on('receiveorderupdate', handleOrderUpdate);

    return () => {
      console.log('[SignalR] ❌ Unregistering order update handler');
      off('receiveorderupdate', handleOrderUpdate);
    };
  }, [isConnected, onOrderUpdate, on, off, handleOrderUpdate]);

  // Register/unregister order status change handler
  useEffect(() => {
    if (!isConnected || !onOrderStatusChange) return;
    on('receiveorderstatuschange', handleOrderStatusChange);
    return () => off('receiveorderstatuschange', handleOrderStatusChange);
  }, [isConnected, onOrderStatusChange, on, off, handleOrderStatusChange]);

  // Register/unregister booking update handler
  useEffect(() => {
    if (!isConnected || !onBookingUpdate) return;
    on('receivebookingupdate', handleBookingUpdate);
    return () => off('receivebookingupdate', handleBookingUpdate);
  }, [isConnected, onBookingUpdate, on, off, handleBookingUpdate]);

  // Register/unregister booking status change handler
  useEffect(() => {
    if (!isConnected || !onBookingStatusChange) return;
    on('receivebookingstatuschange', handleBookingStatusChange);
    return () => off('receivebookingstatuschange', handleBookingStatusChange);
  }, [isConnected, onBookingStatusChange, on, off, handleBookingStatusChange]);

  // Register/unregister product update handler
  useEffect(() => {
    if (!isConnected || !onProductUpdate) return;
    on('receiveproductupdate', handleProductUpdate);
    return () => off('receiveproductupdate', handleProductUpdate);
  }, [isConnected, onProductUpdate, on, off, handleProductUpdate]);

  // Register/unregister category update handler
  useEffect(() => {
    if (!isConnected || !onCategoryUpdate) return;
    on('receivecategoryupdate', handleCategoryUpdate);
    return () => off('receivecategoryupdate', handleCategoryUpdate);
  }, [isConnected, onCategoryUpdate, on, off, handleCategoryUpdate]);

  // Register/unregister service update handler
  useEffect(() => {
    if (!isConnected || !onServiceUpdate) return;
    on('receiveserviceupdate', handleServiceUpdate);
    return () => off('receiveserviceupdate', handleServiceUpdate);
  }, [isConnected, onServiceUpdate, on, off, handleServiceUpdate]);

  // Register/unregister announcement handler
  useEffect(() => {
    if (!isConnected || !onAnnouncement) return;
    on('receiveannouncement', handleAnnouncement);
    return () => off('receiveannouncement', handleAnnouncement);
  }, [isConnected, onAnnouncement, on, off, handleAnnouncement]);
};
