<script lang="ts">
  import '../app.css';
  import ToastHost from '$lib/components/ui/ToastHost.svelte';

  let { children } = $props();
</script>

<div class="flex h-dvh flex-col overflow-hidden bg-canvas text-primary-text">
  {@render children()}
</div>

<ToastHost />
