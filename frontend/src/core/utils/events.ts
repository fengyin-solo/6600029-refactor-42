import type { ModuleEvent, EventHandler, EventEmitter } from '../types';

export function createEventEmitter(): EventEmitter {
  const handlers = new Map<string, Set<EventHandler>>();

  const on = <T>(eventType: string, handler: EventHandler<T>): (() => void) => {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, new Set());
    }
    handlers.get(eventType)!.add(handler as EventHandler);
    return () => off(eventType, handler as EventHandler);
  };

  const emit = <T>(eventType: string, payload: T): void => {
    const event: ModuleEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    handlers.get(eventType)?.forEach((h) => h(event));
    handlers.get('*')?.forEach((h) => h(event));
  };

  const off = (eventType: string, handler: EventHandler): void => {
    handlers.get(eventType)?.delete(handler);
  };

  return { on, emit, off };
}
