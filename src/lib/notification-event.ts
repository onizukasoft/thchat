import { EventEmitter } from "events";

const g = global as typeof globalThis & { _notificationBus?: EventEmitter };

if (!g._notificationBus) {
  g._notificationBus = new EventEmitter();
  g._notificationBus.setMaxListeners(50);
}

export const notificationBus = g._notificationBus;
