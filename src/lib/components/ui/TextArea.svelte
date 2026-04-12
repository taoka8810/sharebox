<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    invalid?: boolean;
  }

  // svelte-ignore custom_element_props_identifier
  let {
    invalid = false,
    class: className = '',
    value = $bindable(),
    rows = 4,
    ...rest
  }: Props = $props();

  const base =
    'w-full px-3 py-2 text-[15px] rounded-[var(--radius-micro)] border bg-canvas placeholder:text-muted-text focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)] transition-colors resize-y';
  const borderClass = $derived(
    invalid ? 'border-[var(--color-warning)]' : 'border-[var(--color-border-input)]'
  );
</script>

<textarea bind:value {rows} class="{base} {borderClass} {className}" {...rest}></textarea>
