<script lang="ts">
  interface Props {
    src?: string | null;
    name?: string;
    size?: number;
  }

  let { src = null, name = '?', size = 28 }: Props = $props();

  const initials = $derived(
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0]!.toUpperCase())
      .slice(0, 2)
      .join('')
  );
</script>

{#if src}
  <img
    {src}
    alt={name}
    width={size}
    height={size}
    class="border-border-whisper rounded-full border object-cover"
    style="width:{size}px;height:{size}px"
  />
{:else}
  <span
    class="border-border-whisper bg-canvas-warm text-secondary-text inline-flex items-center justify-center rounded-full border text-[12px] font-semibold"
    style="width:{size}px;height:{size}px"
    aria-label={name}
  >
    {initials}
  </span>
{/if}
