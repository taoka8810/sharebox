<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatRelativeTime } from '$lib/utils/relativeTime';
  import type { TimelineEntry } from '$lib/types/timeline';

  interface Props {
    entry: Extract<TimelineEntry, { kind: 'url' }>;
    onDelete: (id: string) => Promise<void> | void;
  }

  let { entry, onDelete }: Props = $props();

  const relativeTime = $derived(formatRelativeTime(entry.createdAt));

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
</script>

<Card padded={false}>
  <article class="flex flex-col">
    {#if entry.url.ogp.status === 'pending'}
      <!-- pending: skeleton card during OGP fetch (Phase A demo state) -->
      <div class="flex flex-col gap-3 p-4">
        <Skeleton class="h-44 w-full" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    {:else if entry.url.ogp.status === 'success'}
      <a
        href={entry.url.url}
        target="_blank"
        rel="noopener noreferrer"
        class="block no-underline hover:bg-canvas-warm transition-colors rounded-[12px]"
      >
        {#if entry.url.ogp.imageUrl}
          <img
            src={entry.url.ogp.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            class="block max-h-[280px] w-full rounded-t-[12px] object-cover"
          />
        {/if}
        <div class="flex flex-col gap-1.5 p-4">
          {#if entry.url.ogp.siteName}
            <span class="text-muted-text text-[12px] font-medium">{entry.url.ogp.siteName}</span>
          {/if}
          {#if entry.url.ogp.title}
            <h3 class="text-primary-text text-[18px] font-semibold leading-snug tracking-[-0.25px]">
              {entry.url.ogp.title}
            </h3>
          {/if}
          {#if entry.url.ogp.description}
            <p class="text-secondary-text line-clamp-2 text-[14px] leading-relaxed">
              {entry.url.ogp.description}
            </p>
          {/if}
          <span class="text-muted-text mt-1 text-[12px]">{entry.url.domain}</span>
        </div>
      </a>
    {:else}
      <!-- failed: domain-only fallback -->
      <a
        href={entry.url.url}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-start gap-3 p-4 no-underline hover:bg-canvas-warm transition-colors rounded-[12px]"
      >
        <span
          class="text-secondary-text inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-black/[0.05]"
        >
          <Icon name="link" size={20} />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-primary-text truncate text-[15px] font-semibold">{entry.url.domain}</p>
          <p class="text-muted-text truncate text-[12px]">{entry.url.url}</p>
        </div>
      </a>
    {/if}

    <footer
      class="border-border-whisper text-muted-text flex items-center justify-between border-t px-4 py-2 text-[12px]"
    >
      <span>{relativeTime}</span>
      <span class="flex items-center gap-1">
        <button
          type="button"
          onclick={copy}
          class="hover:bg-canvas-warm text-secondary-text inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          aria-label="URL をコピー"
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
    </footer>
  </article>
</Card>
