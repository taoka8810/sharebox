<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import MessageActionMenu from '$lib/components/timeline/MessageActionMenu.svelte';
  import type { MessageAction } from '$lib/components/timeline/messageAction';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatBytes } from '$lib/utils/formatBytes';

  const TEXT_MAX = 100_000;
  const FILE_MAX = 50 * 1024 * 1024;

  interface Props {
    onSubmitText: (body: string) => Promise<void> | void;
    onSubmitUrl: (url: string) => Promise<void> | void;
    onUploadFile: (file: File, onProgress: (pct: number) => void) => Promise<void> | void;
  }

  let { onSubmitText, onSubmitUrl, onUploadFile }: Props = $props();

  let body = $state('');
  let submitting = $state(false);
  let uploadProgress = $state<number | null>(null);
  let uploadingName = $state<string | null>(null);
  let textareaEl: HTMLTextAreaElement | null = $state(null);
  let imageInputEl: HTMLInputElement | null = $state(null);
  let videoInputEl: HTMLInputElement | null = $state(null);
  let fileInputEl: HTMLInputElement | null = $state(null);
  let attachMenuOpen = $state(false);

  const trimmed = $derived(body.trim());
  const isUrl = $derived.by(() => {
    if (!trimmed || /\s/.test(trimmed)) return false;
    try {
      const u = new URL(trimmed);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  });
  const canSend = $derived(trimmed.length > 0 && !submitting);

  function autoGrow() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 160)}px`;
  }

  $effect(() => {
    // Re-grow when body changes (e.g. after clearing on submit).
    void body;
    autoGrow();
  });

  async function handleSend() {
    if (!canSend) return;
    if (body.length > TEXT_MAX) {
      showToast(`${TEXT_MAX.toLocaleString()} 文字を超えています`, 'error');
      return;
    }
    submitting = true;
    try {
      if (isUrl) {
        await onSubmitUrl(trimmed);
      } else {
        await onSubmitText(trimmed);
      }
      body = '';
    } catch (err) {
      showToast(err instanceof Error ? err.message : '投稿に失敗しました', 'error');
    } finally {
      submitting = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFiles(input: HTMLInputElement) {
    // TEMP DEBUG: confirm whether onchange fires at all on the failing
    // Android video flow. Remove once root cause is identified.
    showToast(`onchange: files=${input.files?.length ?? 0}`, 'success');

    // Snapshot the picked files before clearing the input value below, since
    // the FileList reference is tied to the input and reading it after the
    // reset can yield an empty list on some browsers.
    const list = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (list.length === 0) {
      // Surface the silent case where the picker closed without delivering
      // a file (e.g. Android Chrome occasionally returns an empty FileList
      // for large videos shared via content:// URIs).
      showToast('ファイルが取得できませんでした', 'error');
      return;
    }

    const accepted = list.filter((f) => f.size <= FILE_MAX);
    const oversized = list.length - accepted.length;
    if (oversized > 0) {
      showToast(
        `${oversized} 件がサイズ上限 ${formatBytes(FILE_MAX)} を超えたためスキップしました`,
        'error'
      );
    }
    if (accepted.length === 0) return;

    try {
      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i]!;
        uploadingName =
          accepted.length > 1 ? `${file.name} (${i + 1}/${accepted.length})` : file.name;
        uploadProgress = 0;
        try {
          await onUploadFile(file, (pct) => {
            uploadProgress = pct;
          });
        } catch (err) {
          showToast(
            err instanceof Error ? err.message : `${file.name} のアップロードに失敗しました`,
            'error'
          );
        }
      }
    } finally {
      setTimeout(() => {
        uploadProgress = null;
        uploadingName = null;
      }, 400);
    }
  }

  const attachActions: MessageAction[] = [
    { label: '写真', icon: 'image', onSelect: () => imageInputEl?.click() },
    { label: '動画', icon: 'video', onSelect: () => videoInputEl?.click() },
    { label: 'ファイル', icon: 'file', onSelect: () => fileInputEl?.click() }
  ];
</script>

<div class="border-border-whisper bg-canvas/95 border-t backdrop-blur">
  <div class="mx-auto max-w-[1200px] px-3 py-2 sm:px-4 sm:py-3">
    {#if uploadProgress !== null}
      <div class="mb-2 px-1">
        <ProgressBar value={uploadProgress} label={uploadingName ?? 'アップロード中...'} />
      </div>
    {/if}
    <div
      class="border-border-whisper bg-canvas-warm flex items-end gap-2 rounded-[20px] border px-2 py-1.5"
    >
      <button
        type="button"
        class="text-secondary-text hover:bg-canvas inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
        aria-label="ファイルを添付"
        onclick={() => (attachMenuOpen = true)}
        disabled={submitting || uploadProgress !== null}
      >
        <Icon name="upload" size={18} />
      </button>
      <input
        bind:this={imageInputEl}
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        onchange={(e) => handleFiles(e.currentTarget as HTMLInputElement)}
      />
      <input
        bind:this={videoInputEl}
        type="file"
        accept="video/*"
        class="hidden"
        onchange={(e) => handleFiles(e.currentTarget as HTMLInputElement)}
      />
      <input
        bind:this={fileInputEl}
        type="file"
        multiple
        class="hidden"
        onchange={(e) => handleFiles(e.currentTarget as HTMLInputElement)}
      />
      <textarea
        bind:this={textareaEl}
        bind:value={body}
        onkeydown={handleKeyDown}
        placeholder="メッセージや URL を入力..."
        rows="1"
        aria-label="メッセージ入力"
        disabled={submitting}
        class="text-primary-text placeholder:text-muted-text max-h-40 min-h-[36px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[15px] leading-snug focus:outline-none"
      ></textarea>
      <button
        type="button"
        onclick={handleSend}
        disabled={!canSend}
        class="bg-accent hover:bg-accent-hover inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors active:scale-[0.95] disabled:opacity-40"
        aria-label={isUrl ? 'URL を送信' : '送信'}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</div>

{#if attachMenuOpen}
  <MessageActionMenu actions={attachActions} onClose={() => (attachMenuOpen = false)} />
{/if}
