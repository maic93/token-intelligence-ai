import { WebSocketServer, type WebSocket } from 'ws';
import type { Server as HttpServer } from 'node:http';
import { createLogger } from '@token-intelligence-ai/shared';

const log = createLogger('api:ws');
let wss: WebSocketServer | null = null;

export function createWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    log.info('WebSocket client connected');

    ws.on('close', () => {
      log.info('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      log.error('WebSocket error', { error: String(err) });
    });
  });

  log.info('WebSocket server initialized', { path: '/ws' });
  return wss;
}

export function broadcast(event: string, data: unknown): void {
  if (!wss) return;

  const message = JSON.stringify({ event, data });

  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
      count++;
    }
  });

  if (count > 0) {
    log.info('WebSocket broadcast', { event, clients: count });
  }
}

export function closeWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
}
