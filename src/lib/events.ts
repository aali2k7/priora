import { EventEmitter } from "events";

export interface PrioraServerEvent {
  type: "new-email" | "sync-complete" | "thread-analyzed";
  userId?: string;
  threadId?: string;
  emailAddress?: string;
  timestamp: number;
}

// Global server-side event emitter singleton
const globalEvents = globalThis as unknown as {
  prioraEventEmitter?: EventEmitter;
};

export const prioraEvents = globalEvents.prioraEventEmitter ?? new EventEmitter();
prioraEvents.setMaxListeners(50);

if (process.env.NODE_ENV !== "production") {
  globalEvents.prioraEventEmitter = prioraEvents;
}

export function broadcastServerEvent(event: PrioraServerEvent): void {
  prioraEvents.emit("priora-event", event);
}
