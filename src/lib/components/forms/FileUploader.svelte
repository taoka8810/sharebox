<script lang="ts">
  import Icon from '$lib/components/ui/Icon.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';
  import { formatBytes } from '$lib/utils/formatBytes';

  const MAX_BYTES = 50 * 1024 * 1024;

  interface Props {
    onUpload: (file: File) => Promise<void> | void;
  }

  let { onUpload }: Props = $props();

  let dragOver = $state(false);
  let progress = $state<number | null>(null);
  let activeFileName = $state<string | null>(null);
  let inputEl: HTMLInputElement | null = $state(null);

  function pick() {
    inputEl?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    if (file.size > MAX_BYTES) {
      showToast(
        `サイズ上限 ${formatBytes(MAX_BYTES)} を超えています (${formatBytes(file.size)})`,
        'error'
      );
      return;
    }
    activeFileName = file.name;
    progress = 0;
    // Phase A mock: animate the progress bar over ~1.2 s.
    const tick = setInterval(() => {
      progress = Math.min(95, (progress ?? 0) + Math.random() * 18);
    }, 80);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      clearInterval(tick);
      progress = 100;
      await onUpload(file);
      showToast(`${file.name} をアップロードしました`, 'success');
    } catch (err) {
      clearInterval(tick);
      showToast(err instanceof Error ? err.message : 'アップロードに失敗しました', 'error');
    } finally {
      setTimeout(() => {
        progress = null;
        activeFileName = null;
      }, 400);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }
</script>

<div class="flex flex-col gap-2">
  <button
    type="button"
    class="border-border-whisper hover:border-accent flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed px-6 py-8 text-center transition-colors {dragOver
      ? 'border-accent bg-canvas-warm'
      : 'bg-canvas'}"
    ondragover={(e) => {
      e.preventDefault();
      dragOver = true;
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={onDrop}
    onclick={pick}
    aria-label="ファイルを選択またはドラッグ&ドロップ"
    disabled={progress !== null}
  >
    <span
      class="text-secondary-text inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05]"
    >
      <Icon name="upload" size={20} />
    </span>
    <span class="text-[15px] font-semibold">クリックまたはドラッグでアップロード</span>
    <span class="text-muted-text text-[12px]">最大 {formatBytes(MAX_BYTES)}</span>
  </button>
  <input
    bind:this={inputEl}
    type="file"
    class="hidden"
    onchange={(e) => handleFiles((e.currentTarget as HTMLInputElement).files)}
  />
  {#if progress !== null}
    <div class="border-border-whisper rounded-[12px] border bg-canvas px-4 py-3">
      <ProgressBar value={progress} label={activeFileName ?? 'アップロード中...'} />
    </div>
  {/if}
</div>
