<script lang="ts">
  import '../app.css';
  import ToastHost from '$lib/components/ui/ToastHost.svelte';

  let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col bg-canvas text-primary-text">
  <header
    class="border-border-whisper sticky top-0 z-20 border-b bg-canvas/90 backdrop-blur"
  >
    <div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
      <a href="/" class="flex items-center gap-2 text-[15px] font-semibold no-underline">
        <span
          class="bg-accent inline-flex h-7 w-7 items-center justify-center rounded-md text-white"
          aria-hidden="true"
        >
          <!-- minimal box mark -->
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </span>
        sharebox
      </a>
      <nav class="flex items-center gap-2">
        <!-- header actions are wired in Phase B (logout button etc.) -->
      </nav>
    </div>
  </header>

  <main class="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
    {@render children()}
  </main>

  <footer
    class="border-border-whisper text-secondary-text border-t bg-canvas-warm py-6 text-center text-[14px]"
  >
    <p>sharebox · personal device sync</p>
  </footer>
</div>

<ToastHost />
