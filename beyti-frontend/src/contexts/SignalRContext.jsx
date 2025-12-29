import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};

export const SignalRProvider = ({ children }) => {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const connectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Event handlers storage
  const eventHandlersRef = useRef({});

  const startConnection = async (userId) => {
    if (!userId) {
      console.log('[SignalR] No userId provided, skipping connection');
      return;
    }

    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      console.log('[SignalR] Already connected');
      return;
    }

    try {
      console.log('[SignalR] Building connection...');

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl('https://localhost:7062/notificationHub', {
          accessTokenFactory: () => {
            const token = localStorage.getItem('authToken');
            return token || '';
          },
          withCredentials: true,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            if (retryContext.previousRetryCount === 3) return 30000;
            return 60000;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      newConnection.onreconnecting((error) => {
        console.log('[SignalR] Connection lost, reconnecting...', error);
        setIsConnected(false);
        setConnectionError('Reconnecting...');
      });

      newConnection.onreconnected((connectionId) => {
        console.log('[SignalR] Reconnected with ID:', connectionId);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        // Re-register user after reconnection
        if (userId) {
          newConnection.invoke('RegisterUser', parseInt(userId))
            .catch(err => console.error('[SignalR] Error re-registering user:', err));
        }
      });

      newConnection.onclose((error) => {
        console.log('[SignalR] Connection closed', error);
        setIsConnected(false);
        connectionRef.current = null;

        // Attempt manual reconnection if automatic reconnect fails
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[SignalR] Attempting manual reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            startConnection(userId);
          }, delay);
        } else {
          setConnectionError('Connection failed. Please refresh the page.');
        }
      });

      // Start the connection
      await newConnection.start();
      console.log('[SignalR] Connected successfully');

      connectionRef.current = newConnection;
      setConnection(newConnection);
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;

      // Register user with the hub
      await newConnection.invoke('RegisterUser', parseInt(userId));
      console.log('[SignalR] User registered:', userId);

      // Re-attach any existing event handlers
      Object.entries(eventHandlersRef.current).forEach(([event, handlers]) => {
        handlers.forEach(handler => {
          newConnection.on(event, handler);
        });
      });

    } catch (error) {
      console.error('[SignalR] Connection error:', error);
      setConnectionError(error.message);
      connectionRef.current = null;

      // Retry connection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[SignalR] Retrying connection in ${delay}ms`);

        reconnectTimeoutRef.current = setTimeout(() => {
          startConnection(userId);
        }, delay);
      }
    }
  };

  const stopConnection = async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log('[SignalR] Connection stopped');
      } catch (error) {
        console.error('[SignalR] Error stopping connection:', error);
      }
      connectionRef.current = null;
      setConnection(null);
      setIsConnected(false);
    }
  };

  const on = (eventName, handler) => {
    if (!eventHandlersRef.current[eventName]) {
      eventHandlersRef.current[eventName] = [];
    }
    eventHandlersRef.current[eventName].push(handler);

    if (connectionRef.current) {
      connectionRef.current.on(eventName, handler);
    }
  };

  const off = (eventName, handler) => {
    if (eventHandlersRef.current[eventName]) {
      eventHandlersRef.current[eventName] = eventHandlersRef.current[eventName].filter(h => h !== handler);
    }

    if (connectionRef.current) {
      connectionRef.current.off(eventName, handler);
    }
  };

  const invoke = async (methodName, ...args) => {
    if (connectionRef.current && isConnected) {
      try {
        return await connectionRef.current.invoke(methodName, ...args);
      } catch (error) {
        console.error(`[SignalR] Error invoking ${methodName}:`, error);
        throw error;
      }
    } else {
      console.warn('[SignalR] Cannot invoke method - not connected');
      throw new Error('SignalR not connected');
    }
  };

  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, []);

  const value = {
    connection: connectionRef.current,
    isConnected,
    connectionError,
    startConnection,
    stopConnection,
    on,
    off,
    invoke
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};
