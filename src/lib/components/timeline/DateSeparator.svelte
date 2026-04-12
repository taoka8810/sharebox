<script lang="ts">
  interface Props {
    label: string;
  }
  let { label }: Props = $props();
</script>

<div class="my-4 flex items-center justify-center" aria-hidden="true">
  <span
    class="border-border-whisper text-muted-text rounded-full border bg-canvas px-3 py-0.5 text-[11px] font-semibold tracking-[0.125px]"
  >
    {label}
  </span>
</div>
