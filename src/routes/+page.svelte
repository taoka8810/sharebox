<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import MessageComposer from '$lib/components/MessageComposer.svelte';
  import TextEntry from '$lib/components/timeline/TextEntry.svelte';
  import FileEntry from '$lib/components/timeline/FileEntry.svelte';
  import UrlEntry from '$lib/components/timeline/UrlEntry.svelte';
  import DateSeparator from '$lib/components/timeline/DateSeparator.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { dayKey, dayLabel } from '$lib/utils/dayLabel';
  import { invalidateAll } from '$app/navigation';
  import type { TimelineEntry } from '$lib/types/timeline';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Local state seeded from server data. Optimistic updates push into here
  // immediately; $effect.pre below resyncs from server data on every change
  // (initial render, after invalidateAll(), etc.) so SSR and client stay
  // in sync without exposing a flash of empty timeline.
  let entries = $state<TimelineEntry[]>([]);
  let scrollHost: HTMLDivElement | null = $state(null);

  $effect.pre(() => {
    entries = [...data.entries];
  });

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

  function scrollToBottom() {
    if (!scrollHost) return;
    queueMicrotask(() => {
      if (scrollHost) scrollHost.scrollTop = scrollHost.scrollHeight;
    });
  }

  $effect(() => {
    void entries;
    scrollToBottom();
  });

  // Refetch on tab visibility change so other devices' updates show up.
  $effect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') {
        invalidateAll();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      let message = `${res.status}`;
      try {
        const errorData = (await res.json()) as { error?: { message?: string }; message?: string };
        message = errorData?.error?.message ?? errorData?.message ?? message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json() as Promise<T>;
  }

  async function submitText(body: string) {
    const created = await postJson<TimelineEntry>('/api/entries/text', { body });
    entries = [...entries, created];
  }

  async function submitUrl(url: string) {
    // Phase 7 will swap this for /api/entries/url. For now, post as text so
    // the message still shows up (Phase 5 only ships the text path).
    const created = await postJson<TimelineEntry>('/api/entries/text', { body: url });
    entries = [...entries, created];
  }

  async function uploadFile(file: File, onProgress: (pct: number) => void) {
    // Use XHR rather than fetch so we can wire upload.onprogress to the
    // composer's progress bar (fetch's body streams don't expose progress).
    const created = await new Promise<TimelineEntry>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files');
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress((event.loaded / event.total) * 100);
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as TimelineEntry);
          } catch {
            reject(new Error('invalid_response'));
          }
        } else {
          let message = `${xhr.status}`;
          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: { message?: string } };
            message = parsed.error?.message ?? message;
          } catch {
            // ignore
          }
          reject(new Error(message));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('network_error')));
      xhr.addEventListener('abort', () => reject(new Error('aborted')));
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
    entries = [...entries, created];
  }

  async function deleteEntry(id: string) {
    const previous = entries;
    entries = entries.filter((e) => e.id !== id);
    try {
      const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        throw new Error(`${res.status}`);
      }
      showToast('削除しました', 'success');
    } catch (err) {
      entries = previous;
      throw err;
    }
  }

  async function logout() {
    await fetch('/logout', { method: 'POST' });
    location.href = '/login';
  }
</script>

<svelte:head>
  <title>sharebox</title>
</svelte:head>

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
    <Button variant="ghost" size="sm" onclick={logout}>
      <Icon name="log-out" size={14} />
      <span class="hidden sm:inline">ログアウト</span>
    </Button>
  </div>
</header>

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
