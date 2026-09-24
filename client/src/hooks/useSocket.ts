import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket | null => socketInstance;

export const initSocket = (token: string): Socket => {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const useSocket = (): Socket | null => {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (token) {
      socketRef.current = initSocket(token);
    }
  }, [token]);

  return socketRef.current;
};
