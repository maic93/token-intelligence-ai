import { useEffect, useRef, useState } from 'react';
import type { TokenData, WebSocketMessage, AlertMessage } from '../types';
import { createWebSocketUrl } from '../api';

interface UseWebSocketOptions {
  onTokenDiscovery: (token: TokenData) => void;
  onAlert?: (alert: AlertMessage) => void;
}

export function useWebSocket({ onTokenDiscovery, onAlert }: UseWebSocketOptions): {
  isConnected: boolean;
} {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onTokenRef = useRef(onTokenDiscovery);
  const onAlertRef = useRef(onAlert);
  onTokenRef.current = onTokenDiscovery;
  onAlertRef.current = onAlert;

  useEffect(() => {
    let closed = false;

    function connect() {
      if (closed) return;
      const ws = new WebSocket(createWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retriesRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'WATCH_EVENT' && data.event) {
            onAlertRef.current?.(data as AlertMessage);
            return;
          }

          const msg = data as WebSocketMessage;
          if (msg.event === 'token:discovery' && msg.data) {
            onTokenRef.current(msg.data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (closed) return;
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 30_000);
        retriesRef.current++;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { isConnected };
}
