<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'default' | 'success' | 'warning' | 'muted';
    children: Snippet;
  }

  let { tone = 'default', children }: Props = $props();

  const tones: Record<NonNullable<Props['tone']>, string> = {
    default: 'bg-badge-bg text-badge-text',
    success: 'bg-[#e6f6ee] text-[#1aae39]',
    warning: 'bg-[#fff2e6] text-[#dd5b00]',
    muted: 'bg-black/[0.05] text-secondary-text'
  };
</script>

<span
  class="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold tracking-[0.125px] {tones[
    tone
  ]}"
>
  {@render children()}
</span>
