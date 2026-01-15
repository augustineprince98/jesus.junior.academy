'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useStore';
import wsClient from '@/lib/websocket';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface UseWebSocketOptions {
  onNotification?: (notification: Notification) => void;
  onAttendance?: (data: any) => void;
  onHomework?: (data: any) => void;
  onAnnouncement?: (data: any) => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cleanupRef = useRef<(() => void)[]>([]);

  const connect = useCallback(async () => {
    if (!token) return;

    try {
      await wsClient.connect(token);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setIsConnected(false);
  }, []);

  // Connect on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && token && options.autoConnect !== false) {
      connect();
    }

    return () => {
      // Only disconnect if we connected
      if (options.autoConnect !== false) {
        disconnect();
      }
    };
  }, [isAuthenticated, token, connect, disconnect, options.autoConnect]);

  // Set up message handlers
  useEffect(() => {
    // Clean up previous handlers
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];

    // Connected/disconnected handler
    const unsubConnected = wsClient.on('connected', () => {
      setIsConnected(true);
    });
    cleanupRef.current.push(unsubConnected);

    // Notification handler
    const unsubNotification = wsClient.on('notification', (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      options.onNotification?.(data);
    });
    cleanupRef.current.push(unsubNotification);

    // Attendance update handler
    if (options.onAttendance) {
      const unsubAttendance = wsClient.on('attendance', options.onAttendance);
      cleanupRef.current.push(unsubAttendance);
    }

    // Homework update handler
    if (options.onHomework) {
      const unsubHomework = wsClient.on('homework', options.onHomework);
      cleanupRef.current.push(unsubHomework);
    }

    // Announcement handler
    if (options.onAnnouncement) {
      const unsubAnnouncement = wsClient.on('announcement', options.onAnnouncement);
      cleanupRef.current.push(unsubAnnouncement);
    }

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, [options.onNotification, options.onAttendance, options.onHomework, options.onAnnouncement]);

  // Mark notification as read
  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    send: wsClient.send.bind(wsClient),
  };
}

export default useWebSocket;
