<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Icon from '$lib/components/ui/Icon.svelte';
  import type { MessageAction } from './messageAction';

  interface Props {
    actions: MessageAction[];
    onClose: () => void;
  }

  let { actions, onClose }: Props = $props();

  function select(action: MessageAction) {
    onClose();
    queueMicrotask(() => {
      void action.onSelect();
    });
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
  role="presentation"
  onclick={onClose}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') onClose();
  }}
  tabindex="-1"
  transition:fade={{ duration: 180, easing: cubicOut }}
>
  <div
    role="menu"
    class="bg-canvas w-full max-w-md overflow-hidden rounded-t-2xl shadow-2xl"
    style="padding-bottom: env(safe-area-inset-bottom);"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    tabindex="-1"
    transition:fly={{ y: 320, duration: 260, easing: cubicOut, opacity: 1 }}
  >
    {#each actions as action (action.label)}
      <button
        type="button"
        role="menuitem"
        onclick={() => select(action)}
        class="hover:bg-canvas-warm active:bg-canvas-warm flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] transition-colors {action.danger
          ? 'text-[var(--color-warning)]'
          : 'text-primary-text'}"
      >
        <Icon name={action.icon} size={18} />
        <span>{action.label}</span>
      </button>
    {/each}
    <button
      type="button"
      onclick={onClose}
      class="border-border-whisper text-secondary-text hover:bg-canvas-warm active:bg-canvas-warm flex w-full items-center justify-center border-t px-5 py-4 text-[14px] font-medium transition-colors"
    >
      キャンセル
    </button>
  </div>
</div>
