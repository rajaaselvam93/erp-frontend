import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store';
import { addNotification } from '../store/appSlice';
import type { Notification } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.info('Socket connected:', socket.id);
    });

    socket.on('notification:new', (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    socket.on('notification:broadcast', (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    socket.on('disconnect', () => {
      console.info('Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, dispatch]);

  const joinModule = (moduleId: string) => {
    socketRef.current?.emit('join:module', moduleId);
  };

  const leaveModule = (moduleId: string) => {
    socketRef.current?.emit('leave:module', moduleId);
  };

  return { socket: socketRef.current, joinModule, leaveModule };
};
