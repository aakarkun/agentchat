/**
 * WebSocket manager placeholder. The current AgentChat API is REST-only.
 * This class provides the interface for future WebSocket support; for now
 * real-time behavior is achieved via polling in hooks (useMessages, useParticipants).
 */
export type UnsubscribeFn = () => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers = new Map<string, Set<(payload: unknown) => void>>();

  connect(_token: string): void {
    // No-op until API supports WebSocket. Hooks use REST polling instead.
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  send(_event: string, _payload: unknown): void {
    // No-op until WebSocket is available.
  }

  on(event: string, handler: (payload: unknown) => void): UnsubscribeFn {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
