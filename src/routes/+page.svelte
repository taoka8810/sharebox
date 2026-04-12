<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import StorageUsage from '$lib/components/StorageUsage.svelte';
  import EntryFilter from '$lib/components/timeline/EntryFilter.svelte';
  import TextEntry from '$lib/components/timeline/TextEntry.svelte';
  import FileEntry from '$lib/components/timeline/FileEntry.svelte';
  import UrlEntry from '$lib/components/timeline/UrlEntry.svelte';
  import TextComposer from '$lib/components/forms/TextComposer.svelte';
  import FileUploader from '$lib/components/forms/FileUploader.svelte';
  import UrlComposer from '$lib/components/forms/UrlComposer.svelte';
  import { mockTimeline } from '$lib/mocks/timeline';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import type { EntryFilterKind, TimelineEntry } from '$lib/types/timeline';

  // Phase A: timeline state lives entirely in the page component, seeded
  // from the mock module. Phase B will replace this with data loaded from
  // +page.server.ts via Drizzle/D1.
  let entries = $state<TimelineEntry[]>([...mockTimeline]);
  let filter = $state<EntryFilterKind>('all');
  let composerKind = $state<'text' | 'file' | 'url'>('text');

  const counts = $derived({
    all: entries.length,
    text: entries.filter((e) => e.kind === 'text').length,
    file: entries.filter((e) => e.kind === 'file').length,
    url: entries.filter((e) => e.kind === 'url').length
  } satisfies Record<EntryFilterKind, number>);

  const filtered = $derived(
    filter === 'all' ? entries : entries.filter((e) => e.kind === filter)
  );

  const totalBytes = $derived(
    entries.reduce((sum, e) => {
      if (e.kind === 'text') return sum + new Blob([e.text.body]).size;
      if (e.kind === 'file') return sum + e.file.byteSize;
      return sum;
    }, 0)
  );

  function newId() {
    return `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // Mock submission handlers (Phase A): just prepend to local state.

  async function submitText(body: string) {
    await new Promise((r) => setTimeout(r, 200));
    const entry: TimelineEntry = {
      id: newId(),
      kind: 'text',
      createdAt: Date.now(),
      text: { body }
    };
    entries = [entry, ...entries];
  }

  async function uploadFile(file: File) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : null;
    const entry: TimelineEntry = {
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
    };
    entries = [entry, ...entries];
  }

  async function submitUrl(url: string) {
    // Mock OGP fetch latency.
    await new Promise((r) => setTimeout(r, 800));
    const parsed = new URL(url);
    const entry: TimelineEntry = {
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
    };
    entries = [entry, ...entries];
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
  <title>sharebox · タイムライン</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <!-- Top bar with avatar + storage + logout -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-3">
      <Avatar name="Owner" size={40} />
      <div>
        <p class="text-[14px] font-semibold">こんにちは</p>
        <p class="text-secondary-text text-[12px]">あなたの個人共有ボックス</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="hidden sm:block sm:w-64">
        <StorageUsage totalBytes={totalBytes} />
      </div>
      <Button variant="ghost" size="sm" onclick={mockLogout}>
        <Icon name="log-out" size={14} />
        ログアウト
      </Button>
    </div>
  </div>
  <div class="sm:hidden">
    <StorageUsage totalBytes={totalBytes} />
  </div>

  <!-- Composer card with kind switcher -->
  <Card>
    <div class="flex flex-col gap-4">
      <div
        class="border-border-whisper inline-flex w-fit items-center gap-1 rounded-[var(--radius-pill)] border bg-canvas-warm p-1"
        role="tablist"
        aria-label="投稿種別"
      >
        {#each [{ id: 'text' as const, label: 'テキスト' }, { id: 'file' as const, label: 'ファイル' }, { id: 'url' as const, label: 'URL' }] as opt (opt.id)}
          <button
            type="button"
            role="tab"
            aria-selected={composerKind === opt.id}
            onclick={() => (composerKind = opt.id)}
            class="rounded-[var(--radius-pill)] px-3 py-1 text-[13px] font-semibold transition-colors {composerKind ===
            opt.id
              ? 'bg-primary-text text-white'
              : 'text-secondary-text hover:text-primary-text'}"
          >
            {opt.label}
          </button>
        {/each}
      </div>
      {#if composerKind === 'text'}
        <TextComposer onSubmit={submitText} />
      {:else if composerKind === 'file'}
        <FileUploader onUpload={uploadFile} />
      {:else}
        <UrlComposer onSubmit={submitUrl} />
      {/if}
    </div>
  </Card>

  <!-- Filter tabs -->
  <div class="flex items-center justify-between">
    <h2 class="text-[20px] font-semibold tracking-[-0.25px]">タイムライン</h2>
    <EntryFilter value={filter} {counts} onChange={(v) => (filter = v)} />
  </div>

  <!-- Timeline list -->
  {#if filtered.length === 0}
    <Card padded={false}>
      <EmptyState
        icon="inbox"
        title={filter === 'all' ? '最初の投稿をしてみましょう' : '該当する投稿がありません'}
        description={filter === 'all'
          ? '上の入力欄からテキスト・ファイル・URL を共有できます。'
          : '別のフィルタを試してみてください。'}
      />
    </Card>
  {:else}
    <div class="flex flex-col gap-4">
      {#each filtered as entry (entry.id)}
        {#if entry.kind === 'text'}
          <TextEntry {entry} onDelete={deleteEntry} />
        {:else if entry.kind === 'file'}
          <FileEntry {entry} onDelete={deleteEntry} />
        {:else}
          <UrlEntry {entry} onDelete={deleteEntry} />
        {/if}
      {/each}
    </div>
  {/if}
</div>
