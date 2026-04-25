<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { timeLabel } from '$lib/utils/dayLabel';
  import { longpress } from '$lib/utils/longpress';
  import type { TimelineEntry } from '$lib/types/timeline';
  import MessageActionMenu from './MessageActionMenu.svelte';
  import type { MessageAction } from './messageAction';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'text' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const time = $derived(timeLabel(entry.createdAt));

  let menuOpen = $state(false);

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

  const menuActions: MessageAction[] = [
    { label: 'コピー', icon: 'clipboard', onSelect: copy },
    { label: '削除', icon: 'trash', onSelect: handleDelete, danger: true }
  ];
</script>

<div class="group flex items-end justify-end gap-2">
  <div class="text-muted-text mb-1 flex flex-col items-end gap-1 text-[11px]">
    <span class="hidden gap-1 group-hover:flex">
      <button
        type="button"
        onclick={copy}
        class="hover:bg-canvas-warm text-secondary-text inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors"
        aria-label="コピー"
      >
        <Icon name="clipboard" size={13} />
      </button>
      <button
        type="button"
        onclick={handleDelete}
        class="hover:bg-canvas-warm text-secondary-text inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:text-[var(--color-warning)]"
        aria-label="削除"
      >
        <Icon name="trash" size={13} />
      </button>
    </span>
    <span>{time}</span>
  </div>
  <div
    class="bg-badge-bg text-primary-text max-w-[78%] rounded-2xl rounded-tr-md px-4 py-2.5 shadow-[var(--shadow-card)]"
    use:longpress={{ onTrigger: () => (menuOpen = true) }}
  >
    <pre class="font-sans text-[15px] leading-relaxed whitespace-pre-wrap break-words">{entry.text
        .body}</pre>
  </div>
</div>

{#if menuOpen}
  <MessageActionMenu actions={menuActions} onClose={() => (menuOpen = false)} />
{/if}
