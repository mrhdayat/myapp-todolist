import { SyncMessage, AppSettings, Task } from '@/types/task';

const CHANNEL_NAME = 'daily_focus_sync_channel';
const RESET_LOCK_KEY = 'daily_focus_reset_lock';
const LOCK_TIMEOUT_MS = 15000; // 15 seconds lock expiration

let channelInstance: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;
  if (!channelInstance) {
    try {
      channelInstance = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channelInstance = null;
    }
  }
  return channelInstance;
}

export function broadcastMessage(msg: SyncMessage): void {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage(msg);
  } catch (err) {
    console.warn('[SyncChannel] Failed to post broadcast message:', err);
  }
}

export function subscribeToSyncChannel(onMessage: (msg: SyncMessage) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object' && 'type' in event.data) {
      onMessage(event.data as SyncMessage);
    }
  };

  ch.addEventListener('message', listener);
  return () => {
    ch.removeEventListener('message', listener);
  };
}

/**
 * Attempts to acquire an exclusive lock for running the daily reset across tabs.
 * Returns true if this tab is the leader, false if another tab is currently resetting.
 */
export function acquireDailyResetLock(targetDate: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return true;

  try {
    const rawLock = localStorage.getItem(RESET_LOCK_KEY);
    const now = Date.now();

    if (rawLock) {
      const [lockedDate, timestampStr] = rawLock.split('_');
      const timestamp = Number(timestampStr);

      // If lock is still valid and within timeout, reject
      if (lockedDate === targetDate && now - timestamp < LOCK_TIMEOUT_MS) {
        return false;
      }
    }

    // Set lock
    localStorage.setItem(RESET_LOCK_KEY, `${targetDate}_${now}`);
    return true;
  } catch {
    return true;
  }
}

export function releaseDailyResetLock(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(RESET_LOCK_KEY);
  } catch {
    // Ignore storage errors
  }
}
