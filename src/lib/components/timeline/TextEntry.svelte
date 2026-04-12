<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatRelativeTime } from '$lib/utils/relativeTime';
  import type { TimelineEntry } from '$lib/types/timeline';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'text' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const relativeTime = $derived(formatRelativeTime(entry.createdAt));

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.text.body);
      showToast('クリップボードにコピーしました', 'success');
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
  }

  async function handleDelete() {
    if (!confirm('この投稿を削除しますか?')) return;
    try {
      await onDelete(entry.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '削除に失敗しました', 'error');
    }
  }
</script>

<Card>
  <article class="flex flex-col gap-3">
    <header class="text-muted-text flex items-center justify-between text-[12px]">
      <span>{relativeTime}</span>
      <span class="flex items-center gap-1">
        <button
          type="button"
          onclick={copy}
          class="hover:bg-canvas-warm text-secondary-text inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          aria-label="テキストをコピー"
        >
          <Icon name="clipboard" size={15} />
        </button>
        <button
          type="button"
          onclick={handleDelete}
          class="hover:bg-canvas-warm text-secondary-text inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:text-[var(--color-warning)]"
          aria-label="削除"
        >
          <Icon name="trash" size={15} />
        </button>
      </span>
    </header>
    <pre
      class="text-primary-text whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed">{entry.text.body}</pre>
  </article>
</Card>
