<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import TextEntry from '$lib/components/timeline/TextEntry.svelte';
  import FileEntry from '$lib/components/timeline/FileEntry.svelte';
  import UrlEntry from '$lib/components/timeline/UrlEntry.svelte';
  import DateSeparator from '$lib/components/timeline/DateSeparator.svelte';
  import { mockTimeline } from '$lib/mocks/timeline';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { dayKey, dayLabel } from '$lib/utils/dayLabel';
  import type { TimelineEntry } from '$lib/types/timeline';

  // Phase A: timeline state seeded from mock module. Sorted oldest-first
  // so the natural top-to-bottom reading order matches a chat app.
  let entries = $state<TimelineEntry[]>(
    [...mockTimeline].sort((a, b) => a.createdAt - b.createdAt)
  );
  let scrollHost: HTMLDivElement | null = $state(null);

  // Group entries by calendar day, inserting day-separator markers between
  // groups for the chat-style separator chips.
  type Row = { kind: 'separator'; id: string; label: string } | { kind: 'entry'; entry: TimelineEntry };

  const rows = $derived.by<Row[]>(() => {
    const out: Row[] = [];
    let lastKey: string | null = null;
    for (const entry of entries) {
      const key = dayKey(entry.createdAt);
      if (key !== lastKey) {
        out.push({ kind: 'separator', id: `sep-${key}`, label: dayLabel(entry.createdAt) });
        lastKey = key;
      }
      out.push({ kind: 'entry', entry });
    }
    return out;
  });

  function newId() {
    return `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function scrollToBottom() {
    if (!scrollHost) return;
    queueMicrotask(() => {
      if (scrollHost) scrollHost.scrollTop = scrollHost.scrollHeight;
    });
  }

  $effect(() => {
    // Auto-scroll on entries change.
    void entries;
    scrollToBottom();
  });

  // Mock submission handlers (Phase A): append to local state.

  async function submitText(body: string) {
    await new Promise((r) => setTimeout(r, 200));
    entries = [
      ...entries,
      { id: newId(), kind: 'text', createdAt: Date.now(), text: { body } }
    ];
    showToast('テキストを投稿しました', 'success');
  }

  async function uploadFile(file: File) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : null;
    entries = [
      ...entries,
      {
        id: newId(),
        kind: 'file',
        createdAt: Date.now(),
        file: {
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          byteSize: file.size,
          category: isImage ? 'image' : isVideo ? 'video' : 'other',
          previewUrl,
          downloadUrl: previewUrl ?? '#mock-download'
        }
      }
    ];
    showToast(`${file.name} をアップロードしました`, 'success');
  }

  async function submitUrl(url: string) {
    await new Promise((r) => setTimeout(r, 800));
    const parsed = new URL(url);
    entries = [
      ...entries,
      {
        id: newId(),
        kind: 'url',
        createdAt: Date.now(),
        url: {
          url,
          domain: parsed.hostname,
          ogp: {
            status: 'success',
            title: `${parsed.hostname} のページ`,
            description: 'モック OGP データです。Phase B で本物に置き換わります。',
            imageUrl: null,
            siteName: parsed.hostname
          }
        }
      }
    ];
    showToast('URL を投稿しました', 'success');
  }

  async function deleteEntry(id: string) {
    entries = entries.filter((e) => e.id !== id);
    showToast('削除しました', 'success');
  }

  function mockLogout() {
    showToast('ログアウトしました (mock)', 'info');
  }
</script>

<svelte:head>
  <title>sharebox</title>
</svelte:head>

<!-- Top bar -->
<header
  class="border-border-whisper bg-canvas/90 sticky top-0 z-20 border-b backdrop-blur"
>
  <div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-3 sm:px-4">
    <div class="flex items-center gap-2.5">
      <span
        class="bg-accent inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </span>
      <div class="leading-tight">
        <p class="text-[15px] font-semibold">sharebox</p>
        <p class="text-muted-text text-[11px]">あなたの個人共有ボックス</p>
      </div>
    </div>
    <Button variant="ghost" size="sm" onclick={mockLogout}>
      <Icon name="log-out" size={14} />
      <span class="hidden sm:inline">ログアウト</span>
    </Button>
  </div>
</header>

<!-- Scrollable timeline -->
<div bind:this={scrollHost} class="flex-1 overflow-y-auto bg-canvas-warm">
  <div class="mx-auto flex max-w-[1200px] flex-col gap-3 px-3 py-6 sm:px-6">
    {#if rows.length === 0}
      <EmptyState
        icon="inbox"
        title="最初の投稿をしてみましょう"
        description="下の入力欄からテキスト・ファイル・URL を共有できます。URL を貼ると自動的に OGP が表示されます。"
      />
    {:else}
      {#each rows as row (row.kind === 'separator' ? row.id : row.entry.id)}
        {#if row.kind === 'separator'}
          <DateSeparator label={row.label} />
        {:else if row.entry.kind === 'text'}
          <TextEntry entry={row.entry} onDelete={deleteEntry} />
        {:else if row.entry.kind === 'file'}
          <FileEntry entry={row.entry} onDelete={deleteEntry} />
        {:else}
          <UrlEntry entry={row.entry} onDelete={deleteEntry} />
        {/if}
      {/each}
    {/if}
  </div>
</div>

<MessageComposer onSubmitText={submitText} onSubmitUrl={submitUrl} onUploadFile={uploadFile} />
