<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { timeLabel } from '$lib/utils/dayLabel';
  import { longpress } from '$lib/utils/longpress';
  import type { TimelineEntry } from '$lib/types/timeline';
  import MessageActionMenu from './MessageActionMenu.svelte';
  import type { MessageAction } from './messageAction';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'url' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const time = $derived(timeLabel(entry.createdAt));

  let menuOpen = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(entry.url.url);
      showToast('URL をコピーしました', 'success');
    } catch {
      showToast('コピーに失敗しました', 'error');
    }
  }

  async function handleDelete() {
    if (!confirm('この URL を削除しますか?')) return;
    try {
      await onDelete(entry.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '削除に失敗しました', 'error');
    }
  }

  function openUrl() {
    window.open(entry.url.url, '_blank', 'noopener,noreferrer');
  }

  const menuActions: MessageAction[] = [
    { label: 'リンクを開く', icon: 'link', onSelect: openUrl },
    { label: 'URL をコピー', icon: 'clipboard', onSelect: copy },
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
        aria-label="URL をコピー"
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

  <div class="flex max-w-[78%] flex-col gap-1.5">
    <div
      class="bg-badge-bg text-accent rounded-2xl rounded-tr-md px-4 py-2 text-[13px] break-all shadow-[var(--shadow-card)]"
      use:longpress={{ onTrigger: () => (menuOpen = true) }}
    >
      <a href={entry.url.url} target="_blank" rel="noopener noreferrer" class="no-underline">
        {entry.url.url}
      </a>
    </div>

    {#if entry.url.ogp.status === 'pending'}
      <div
        class="border-border-whisper bg-canvas flex flex-col gap-2 rounded-2xl border p-3 shadow-[var(--shadow-card)]"
      >
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-3 w-3/4" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    {:else if entry.url.ogp.status === 'success'}
      <a
        href={entry.url.url}
        target="_blank"
        rel="noopener noreferrer"
        class="border-border-whisper hover:bg-canvas-warm block overflow-hidden rounded-2xl border bg-canvas no-underline shadow-[var(--shadow-card)] transition-colors"
      >
        {#if entry.url.ogp.imageUrl}
          <img
            src={entry.url.ogp.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            class="block max-h-[200px] w-full object-cover"
          />
        {/if}
        <div class="flex flex-col gap-1 p-3">
          {#if entry.url.ogp.siteName}
            <span class="text-muted-text text-[11px] font-medium">{entry.url.ogp.siteName}</span>
          {/if}
          {#if entry.url.ogp.title}
            <h3 class="text-primary-text text-[14px] leading-snug font-semibold tracking-[-0.25px]">
              {entry.url.ogp.title}
            </h3>
          {/if}
          {#if entry.url.ogp.description}
            <p class="text-secondary-text line-clamp-2 text-[12px] leading-relaxed">
              {entry.url.ogp.description}
            </p>
          {/if}
        </div>
      </a>
    {:else}
      <a
        href={entry.url.url}
        target="_blank"
        rel="noopener noreferrer"
        class="border-border-whisper bg-canvas hover:bg-canvas-warm flex items-center gap-2 rounded-2xl border px-3 py-2 no-underline shadow-[var(--shadow-card)] transition-colors"
      >
        <span
          class="text-secondary-text inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/[0.05]"
        >
          <Icon name="link" size={14} />
        </span>
        <span class="text-primary-text truncate text-[13px] font-semibold">
          {entry.url.domain}
        </span>
      </a>
    {/if}
  </div>
</div>

{#if menuOpen}
  <MessageActionMenu actions={menuActions} onClose={() => (menuOpen = false)} />
{/if}
