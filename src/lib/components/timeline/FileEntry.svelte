<script lang="ts">
  import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatBytes } from '$lib/utils/formatBytes';
  import { timeLabel } from '$lib/utils/dayLabel';
  import type { TimelineEntry } from '$lib/types/timeline';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'file' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const time = $derived(timeLabel(entry.createdAt));

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

<div class="group flex items-end justify-end gap-2">
  <div class="text-muted-text mb-1 flex flex-col items-end gap-1 text-[11px]">
    <button
      type="button"
      onclick={handleDelete}
      class="hover:bg-canvas-warm text-secondary-text hidden h-6 w-6 items-center justify-center rounded-md transition-colors group-hover:inline-flex hover:text-[var(--color-warning)]"
      aria-label="削除"
    >
      <Icon name="trash" size={13} />
    </button>
    <span>{time}</span>
  </div>

  {#if entry.file.category === 'image' && entry.file.previewUrl}
    <div
      class="border-border-whisper block max-w-[78%] overflow-hidden rounded-2xl rounded-tr-md border bg-canvas shadow-[var(--shadow-card)]"
    >
      <a
        href={entry.file.previewUrl}
        target="_blank"
        rel="noopener"
        class="block no-underline"
      >
        <img
          src={entry.file.previewUrl}
          alt={entry.file.originalName}
          loading="lazy"
          decoding="async"
          class="block max-h-[360px] w-full object-cover"
        />
      </a>
      <div
        class="text-secondary-text flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]"
      >
        <span class="min-w-0 flex-1 truncate">{entry.file.originalName}</span>
        <span class="shrink-0">{formatBytes(entry.file.byteSize)}</span>
        <a
          href={entry.file.downloadUrl}
          download={entry.file.originalName}
          class="text-accent inline-flex shrink-0 items-center gap-1 font-semibold no-underline hover:underline"
          aria-label="ダウンロード"
        >
          <Icon name="download" size={12} />
          DL
        </a>
      </div>
    </div>
  {:else if entry.file.category === 'video' && entry.file.previewUrl}
    <div
      class="border-border-whisper block max-w-[78%] overflow-hidden rounded-2xl rounded-tr-md border bg-canvas shadow-[var(--shadow-card)]"
    >
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        src={entry.file.previewUrl}
        controls
        preload="metadata"
        class="block max-h-[360px] w-full bg-black"
      ></video>
      <div
        class="text-secondary-text flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]"
      >
        <span class="min-w-0 flex-1 truncate">{entry.file.originalName}</span>
        <span class="shrink-0">{formatBytes(entry.file.byteSize)}</span>
        <a
          href={entry.file.downloadUrl}
          download={entry.file.originalName}
          class="text-accent inline-flex shrink-0 items-center gap-1 font-semibold no-underline hover:underline"
          aria-label="ダウンロード"
        >
          <Icon name="download" size={12} />
          DL
        </a>
      </div>
    </div>
  {:else}
    <div
      class="border-border-whisper bg-canvas flex max-w-[78%] items-center gap-3 rounded-2xl rounded-tr-md border px-4 py-3 shadow-[var(--shadow-card)]"
    >
      <span
        class="text-secondary-text inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/[0.05]"
      >
        <Icon name={iconForMime(entry.file.mimeType)} size={20} />
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[14px] font-semibold">{entry.file.originalName}</p>
        <p class="text-muted-text text-[11px]">{formatBytes(entry.file.byteSize)}</p>
      </div>
      <a
        href={entry.file.downloadUrl}
        download={entry.file.originalName}
        class="text-accent inline-flex items-center gap-1 text-[13px] font-semibold no-underline hover:underline"
      >
        <Icon name="download" size={13} />
        DL
      </a>
    </div>
  {/if}
</div>
