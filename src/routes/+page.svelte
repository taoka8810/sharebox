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

  type Row =
    | { kind: 'separator'; id: string; label: string }
    | { kind: 'entry'; entry: TimelineEntry };

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

  // OGP and file preview images load lazily, so they don't contribute to
  // scrollHeight on first paint — the initial scrollToBottom() above lands
  // short and the user sees the top. Watch the inner content for size
  // changes and re-pin to the bottom while the user is sitting there.
  // If they've scrolled up to read older entries, stop following so we
  // don't yank them away mid-read.
  $effect(() => {
    if (!scrollHost) return;
    const inner = scrollHost.firstElementChild;
    if (!inner) return;

    let stickToBottom = true;
    function onScroll() {
      if (!scrollHost) return;
      const distance = scrollHost.scrollHeight - scrollHost.scrollTop - scrollHost.clientHeight;
      stickToBottom = distance < 80;
    }
    scrollHost.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      if (stickToBottom && scrollHost) {
        scrollHost.scrollTop = scrollHost.scrollHeight;
      }
    });
    ro.observe(inner);

    return () => {
      ro.disconnect();
      scrollHost?.removeEventListener('scroll', onScroll);
    };
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
    const created = await postJson<TimelineEntry>('/api/entries/url', { url });
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

<header class="border-border-whisper bg-canvas/90 sticky top-0 z-20 border-b backdrop-blur">
  <div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-3 sm:px-4">
    <div class="flex items-center gap-2.5">
      <img src="/apple-touch-icon.png" alt="" width="32" height="32" class="h-8 w-8" />
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
