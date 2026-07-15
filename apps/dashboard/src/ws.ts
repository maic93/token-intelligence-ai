export type TokenDiscoveryHandler = (data: unknown) => void;

export function connectWebSocket(onDiscovery: TokenDiscoveryHandler): WebSocket | null {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === 'token:discovery') {
        onDiscovery(msg.data);
      }
    } catch {
      console.warn('Invalid WebSocket message');
    }
  };

  ws.onerror = () => {
    console.warn('WebSocket error');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting in 5s');
    setTimeout(() => connectWebSocket(onDiscovery), 5000);
  };

  return ws;
}
