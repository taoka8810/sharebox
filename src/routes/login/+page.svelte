<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>sharebox · ログイン</title>
</svelte:head>

<section
  class="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center"
>
  <span
    class="bg-accent inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white"
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
         stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  </span>
  <h1 class="text-[48px] leading-[1] font-bold tracking-[-1.5px]">sharebox</h1>
  <p class="text-secondary-text max-w-md text-[18px] leading-relaxed">
    自分のデバイス間で、テキスト・ファイル・URL をすばやく共有する個人用の共有ボックス。
  </p>
  <div class="mt-2 flex flex-col items-center gap-3">
    <Button onclick={() => console.log('mock: google login')}>
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <g>
          <path
            fill="#FFFFFF"
            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
          />
          <path
            fill="#FFFFFF"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            opacity=".85"
          />
          <path
            fill="#FFFFFF"
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            opacity=".75"
          />
          <path
            fill="#FFFFFF"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"
            opacity=".65"
          />
        </g>
      </svg>
      Google でログイン
    </Button>
    <p class="text-muted-text text-[12px]">
      ホワイトリストに登録されたメールアドレスのみ利用できます
    </p>
  </div>
</section>
