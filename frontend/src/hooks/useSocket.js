// frontend/src/hooks/useSocket.js
// React hook for WebSocket connection to backend

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let globalSocket = null;

export function useSocket() {
  const [socket, setSocket] = useState(globalSocket);

  useEffect(() => {
    // Initialize Socket.IO connection only once globally
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
      });

      // Connection events
      globalSocket.on('connect', () => {
        console.log('✅ WebSocket connected:', globalSocket.id);
        setSocket(globalSocket);
      });

      globalSocket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
      });

      globalSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
      });

      setSocket(globalSocket);
    } else {
      setSocket(globalSocket);
    }

    // Don't disconnect on component unmount - keep global connection
    return () => {};
  }, []);

  return socket;
}

export default useSocket;
