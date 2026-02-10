import { WebSocketManager } from "../../core/WebSocketManager.js";

export interface RealtimeConnection {
  connect(url?: string): Promise<void> | void;
  disconnect(): void;
  subscribe(event: string, handler: (data: unknown) => void): () => void;
  isConnected(): boolean;
}

/**
 * Adapter that exposes the existing WebSocketManager behind the
 * RealtimeConnection interface. Today this is effectively a stub because the
 * API is REST-only; polling is handled in React hooks.
 */
export class WebSocketConnection implements RealtimeConnection {
  private readonly manager: WebSocketManager;

  constructor(manager?: WebSocketManager) {
    this.manager = manager ?? new WebSocketManager();
  }

  connect(url?: string): void {
    this.manager.connect(url);
  }

  disconnect(): void {
    this.manager.disconnect();
  }

  subscribe(event: string, handler: (data: unknown) => void): () => void {
    return this.manager.on(event, handler);
  }

  isConnected(): boolean {
    return this.manager.isConnected();
  }
}

