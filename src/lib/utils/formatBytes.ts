// Pure helper to format a byte count as a human-readable string.

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  const decimalPlaces = i === 0 ? 0 : decimals;
  return `${value.toFixed(decimalPlaces)} ${sizes[i]}`;
}
