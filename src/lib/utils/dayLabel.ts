// Day-grouping helpers used by the chat-style timeline.

export function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(epochMs: number, nowMs: number = Date.now()): string {
  const d = new Date(epochMs);
  const today = new Date(nowMs);
  const yesterday = new Date(nowMs);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(epochMs) === dayKey(today.getTime())) return '今日';
  if (dayKey(epochMs) === dayKey(yesterday.getTime())) return '昨日';
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(d);
}

export function timeLabel(epochMs: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(epochMs);
}
