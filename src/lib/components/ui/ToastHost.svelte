<script lang="ts">
  import { toasts } from './toast-store.svelte.js';
  import Icon from './Icon.svelte';

  const toneIcon = {
    success: 'check' as const,
    error: 'alert-circle' as const,
    info: 'check' as const
  };

  const toneClass: Record<'success' | 'error' | 'info', string> = {
    success: 'border-[#1aae39]/30 text-[#1aae39] bg-[#e6f6ee]',
    error: 'border-[#dd5b00]/30 text-[#dd5b00] bg-[#fff2e6]',
    info: 'border-border-whisper text-primary-text bg-canvas'
  };
</script>

<div
  class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
  aria-live="polite"
  aria-atomic="true"
>
  {#each toasts.items as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-center gap-2 rounded-[var(--radius-card)] border px-4 py-2 text-[14px] font-medium shadow-[var(--shadow-card)] {toneClass[
        toast.tone
      ]}"
    >
      <Icon name={toneIcon[toast.tone]} size={16} />
      <span>{toast.message}</span>
    </div>
  {/each}
</div>
