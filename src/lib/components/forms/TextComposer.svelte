<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import TextArea from '$lib/components/ui/TextArea.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';

  const TEXT_MAX = 100_000;

  interface Props {
    onSubmit: (body: string) => Promise<void> | void;
  }

  let { onSubmit }: Props = $props();

  let body = $state('');
  let submitting = $state(false);
  let touched = $state(false);

  const trimmed = $derived(body.trim());
  const tooLong = $derived(body.length > TEXT_MAX);
  const empty = $derived(trimmed.length === 0);
  const invalid = $derived(touched && (empty || tooLong));

  const errorMessage = $derived(
    tooLong
      ? `${TEXT_MAX.toLocaleString()} 文字を超えています`
      : empty
        ? '空白のみの投稿はできません'
        : ''
  );

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    touched = true;
    if (empty || tooLong) return;
    submitting = true;
    try {
      await onSubmit(trimmed);
      body = '';
      touched = false;
      showToast('テキストを投稿しました', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '投稿に失敗しました', 'error');
    } finally {
      submitting = false;
    }
  }
</script>

<form class="flex flex-col gap-2" onsubmit={handleSubmit}>
  <TextArea
    bind:value={body}
    placeholder="共有するテキストを貼り付け..."
    rows={4}
    invalid={invalid}
    aria-label="共有するテキスト"
    onblur={() => (touched = true)}
    disabled={submitting}
  />
  <div class="flex items-center justify-between gap-3">
    <span class="text-[12px] {invalid ? 'text-[var(--color-warning)]' : 'text-muted-text'}">
      {#if invalid && errorMessage}
        {errorMessage}
      {:else}
        {body.length.toLocaleString()} / {TEXT_MAX.toLocaleString()}
      {/if}
    </span>
    <Button type="submit" disabled={submitting}>
      {submitting ? '投稿中...' : '投稿する'}
    </Button>
  </div>
</form>
