<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    icon?: IconName;
    title: string;
    description?: string;
  }

  let { icon = 'inbox', title, description }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
  <span
    class="border-border-whisper text-muted-text flex h-12 w-12 items-center justify-center rounded-full border"
  >
    <Icon name={icon} size={20} />
  </span>
  <h3 class="text-[18px] font-semibold tracking-[-0.25px]">{title}</h3>
  {#if description}
    <p class="text-secondary-text max-w-sm text-[14px] leading-relaxed">{description}</p>
  {/if}
</div>
