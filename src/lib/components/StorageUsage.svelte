<script lang="ts">
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import { formatBytes } from '$lib/utils/formatBytes';

  interface Props {
    totalBytes: number;
    limitBytes?: number;
  }

  let { totalBytes, limitBytes = 1024 * 1024 * 1024 }: Props = $props();

  const ratio = $derived(totalBytes / limitBytes);
  const tone = $derived<'default' | 'warning'>(ratio > 0.8 ? 'warning' : 'default');
</script>

<div class="border-border-whisper rounded-[12px] border bg-canvas px-4 py-3 shadow-[var(--shadow-card)]">
  <div class="text-secondary-text mb-1.5 flex items-center justify-between text-[12px] font-medium">
    <span>ストレージ使用量</span>
    <span class="text-primary-text font-semibold">
      {formatBytes(totalBytes)} / {formatBytes(limitBytes)}
    </span>
  </div>
  <ProgressBar value={totalBytes} max={limitBytes} {tone} />
</div>
