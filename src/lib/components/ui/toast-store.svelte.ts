// Lightweight toast queue using Svelte 5 runes. No external state library.

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

let nextId = 0;

export const toasts = $state<{ items: Toast[] }>({ items: [] });

export function showToast(message: string, tone: ToastTone = 'info', durationMs = 2500): void {
  const id = ++nextId;
  toasts.items = [...toasts.items, { id, tone, message }];
  setTimeout(() => {
    toasts.items = toasts.items.filter((t) => t.id !== id);
  }, durationMs);
}
