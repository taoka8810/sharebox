<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    radius?: 'card' | 'large';
    elevated?: boolean;
    padded?: boolean;
    class?: string;
    children: Snippet;
  }

  let {
    radius = 'card',
    elevated = true,
    padded = true,
    class: className = '',
    children
  }: Props = $props();

  const radiusClass = $derived(radius === 'large' ? 'rounded-[16px]' : 'rounded-[12px]');
  const shadowClass = $derived(elevated ? 'shadow-[var(--shadow-card)]' : '');
  const padClass = $derived(padded ? 'p-5' : '');
</script>

<div
  class="border-border-whisper bg-canvas border {radiusClass} {shadowClass} {padClass} {className}"
>
  {@render children()}
</div>
