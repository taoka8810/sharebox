<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    invalid?: boolean;
  }

  let {
    invalid = false,
    class: className = '',
    value = $bindable(),
    ...rest
  }: Props = $props();

  const base =
    'w-full h-10 px-3 text-[15px] rounded-[var(--radius-micro)] border bg-canvas placeholder:text-muted-text focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)] transition-colors';
  const borderClass = $derived(
    invalid ? 'border-[var(--color-warning)]' : 'border-[var(--color-border-input)]'
  );
</script>

<input
  bind:value
  class="{base} {borderClass} {className}"
  {...rest}
/>
