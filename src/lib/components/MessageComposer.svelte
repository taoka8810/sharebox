<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
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
  let fileInputEl: HTMLInputElement | null = $state(null);

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
    body;
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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    if (file.size > FILE_MAX) {
      showToast(
        `サイズ上限 ${formatBytes(FILE_MAX)} を超えています (${formatBytes(file.size)})`,
        'error'
      );
      return;
    }
    uploadingName = file.name;
    uploadProgress = 0;
    try {
      await onUploadFile(file, (pct) => {
        uploadProgress = pct;
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'アップロードに失敗しました', 'error');
    } finally {
      setTimeout(() => {
        uploadProgress = null;
        uploadingName = null;
      }, 400);
    }
  }
</script>

<div class="border-border-whisper bg-canvas/95 border-t backdrop-blur">
  <div class="mx-auto max-w-[1200px] px-3 py-2 sm:px-4 sm:py-3">
    {#if uploadProgress !== null}
      <div class="mb-2 px-1">
        <ProgressBar value={uploadProgress} label={uploadingName ?? 'アップロード中...'} />
      </div>
    {/if}
    <div class="border-border-whisper bg-canvas-warm flex items-end gap-2 rounded-[20px] border px-2 py-1.5">
      <button
        type="button"
        class="text-secondary-text hover:bg-canvas inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
        aria-label="ファイルを添付"
        onclick={() => fileInputEl?.click()}
        disabled={submitting || uploadProgress !== null}
      >
        <Icon name="upload" size={18} />
      </button>
      <input
        bind:this={fileInputEl}
        type="file"
        class="hidden"
        onchange={(e) => handleFiles((e.currentTarget as HTMLInputElement).files)}
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
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
             stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</div>
