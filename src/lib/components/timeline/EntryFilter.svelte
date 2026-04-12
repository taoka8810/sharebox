<script lang="ts">
  import type { EntryFilterKind } from '$lib/types/timeline';

  interface Props {
    value: EntryFilterKind;
    counts: Record<EntryFilterKind, number>;
    onChange: (value: EntryFilterKind) => void;
  }

  let { value, counts, onChange }: Props = $props();

  const tabs: { id: EntryFilterKind; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'text', label: 'テキスト' },
    { id: 'file', label: 'ファイル' },
    { id: 'url', label: 'URL' }
  ];
</script>

<div
  class="border-border-whisper inline-flex items-center gap-1 rounded-[var(--radius-pill)] border bg-canvas p-1"
  role="tablist"
  aria-label="エントリ種別フィルタ"
>
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      aria-selected={value === tab.id}
      onclick={() => onChange(tab.id)}
      class="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-[13px] font-semibold transition-colors {value ===
      tab.id
        ? 'bg-primary-text text-white'
        : 'text-secondary-text hover:text-primary-text'}"
    >
      {tab.label}
      <span
        class="inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] {value ===
        tab.id
          ? 'bg-white/20 text-white'
          : 'bg-black/[0.06] text-secondary-text'}"
      >
        {counts[tab.id]}
      </span>
    </button>
  {/each}
</div>
