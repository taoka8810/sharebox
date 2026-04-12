<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { showToast } from '$lib/components/ui/toast-store.svelte.js';

  interface Props {
    onSubmit: (url: string) => Promise<void> | void;
  }

  let { onSubmit }: Props = $props();

  let url = $state('');
  let submitting = $state(false);
  let touched = $state(false);

  function isValid(value: string): boolean {
    if (!value.trim()) return false;
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const valid = $derived(isValid(url));
  const invalid = $derived(touched && !valid);
  const errorMessage = $derived(
    !url.trim() ? 'URL を入力してください' : 'http(s) スキームの URL を入力してください'
  );

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    touched = true;
    if (!valid) return;
    submitting = true;
    try {
      await onSubmit(url.trim());
      url = '';
      touched = false;
      showToast('URL を投稿しました', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '投稿に失敗しました', 'error');
    } finally {
      submitting = false;
    }
  }
</script>

<form class="flex flex-col gap-2" onsubmit={handleSubmit}>
  <div class="flex items-stretch gap-2">
    <Input
      bind:value={url}
      type="url"
      placeholder="https://..."
      invalid={invalid}
      aria-label="共有する URL"
      onblur={() => (touched = true)}
      disabled={submitting}
      class="flex-1"
    />
    <Button type="submit" disabled={submitting}>
      {submitting ? '取得中...' : '投稿する'}
    </Button>
  </div>
  {#if invalid}
    <span class="text-[12px] text-[var(--color-warning)]">{errorMessage}</span>
  {/if}
</form>
