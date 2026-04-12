// Pure helper to format a UNIX epoch (ms) as a relative time string in
// Japanese. Used by timeline entries.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatRelativeTime(epochMs: number, nowMs: number = Date.now()): string {
  const diff = nowMs - epochMs;
  if (diff < 0) return 'たった今';
  if (diff < MINUTE) return 'たった今';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分前`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 時間前`;
  if (diff < 2 * DAY) return '昨日';
  if (diff < WEEK) return `${Math.floor(diff / DAY)} 日前`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)} 週間前`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)} ヶ月前`;
  return `${Math.floor(diff / YEAR)} 年前`;
}
