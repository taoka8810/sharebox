<script lang="ts">
  interface Props {
    class?: string;
    rounded?: 'sm' | 'md' | 'full';
  }

  let { class: className = '', rounded = 'md' }: Props = $props();

  const radius = $derived(
    rounded === 'full' ? 'rounded-full' : rounded === 'sm' ? 'rounded-[4px]' : 'rounded-[8px]'
  );
</script>

<div class="animate-pulse bg-black/[0.06] {radius} {className}"></div>
