<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatBytes } from '$lib/utils/formatBytes';
  import { formatRelativeTime } from '$lib/utils/relativeTime';
  import type { TimelineEntry } from '$lib/types/timeline';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'file' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const relativeTime = $derived(formatRelativeTime(entry.createdAt));

  function iconForMime(mime: string): IconName {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'application/pdf' || mime.startsWith('text/')) return 'file-text';
    if (mime === 'application/zip' || mime === 'application/x-tar' || mime.includes('compressed'))
      return 'file-archive';
    return 'file';
  }

  async function handleDelete() {
    if (!confirm('このファイルを削除しますか?ストレージからも削除されます。')) return;
    try {
      await onDelete(entry.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '削除に失敗しました', 'error');
    }
  }
</script>

<Card padded={false}>
  <article class="flex flex-col">
    {#if entry.file.category === 'image' && entry.file.previewUrl}
      <a
        href={entry.file.downloadUrl}
        target="_blank"
        rel="noopener"
        class="block overflow-hidden rounded-t-[12px]"
      >
        <img
          src={entry.file.previewUrl}
          alt={entry.file.originalName}
          loading="lazy"
          decoding="async"
          class="block max-h-[480px] w-full object-cover"
        />
      </a>
    {:else if entry.file.category === 'video' && entry.file.previewUrl}
      <div class="overflow-hidden rounded-t-[12px] bg-black">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          src={entry.file.previewUrl}
          controls
          preload="metadata"
          class="block max-h-[480px] w-full"
        ></video>
      </div>
    {/if}

    <div
      class="flex items-center gap-3 p-4 {entry.file.category === 'other'
        ? ''
        : 'border-border-whisper border-t'}"
    >
      <span
        class="text-secondary-text inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/[0.05]"
      >
        <Icon name={iconForMime(entry.file.mimeType)} size={20} />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[15px] font-semibold">{entry.file.originalName}</p>
        <p class="text-muted-text text-[12px]">
          {formatBytes(entry.file.byteSize)} · {relativeTime}
        </p>
      </div>
      <a
        href={entry.file.downloadUrl}
        download={entry.file.originalName}
        class="text-accent inline-flex items-center gap-1 text-[14px] font-semibold no-underline hover:underline"
      >
        <Icon name="download" size={14} />
        ダウンロード
      </a>
      <button
        type="button"
        onclick={handleDelete}
        class="hover:bg-canvas-warm text-secondary-text inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:text-[var(--color-warning)]"
        aria-label="削除"
      >
        <Icon name="trash" size={15} />
      </button>
    </div>
  </article>
</Card>
