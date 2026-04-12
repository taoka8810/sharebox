<script lang="ts">
  interface Props {
    value: number;
    max?: number;
    label?: string;
    tone?: 'default' | 'warning';
  }

  let { value, max = 100, label, tone = 'default' }: Props = $props();

  const pct = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
  const fillColor = $derived(tone === 'warning' ? 'bg-[var(--color-warning)]' : 'bg-accent');
</script>

<div class="flex flex-col gap-1">
  {#if label}
    <div class="text-secondary-text flex items-center justify-between text-[12px] font-medium">
      <span>{label}</span>
      <span>{Math.round(pct)}%</span>
    </div>
  {/if}
  <div
    class="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]"
    role="progressbar"
    aria-valuenow={Math.round(pct)}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full {fillColor} transition-[width] duration-200 ease-out"
      style="width: {pct}%"
    ></div>
  </div>
</div>
