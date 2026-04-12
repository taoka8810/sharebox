<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
</script>

<svelte:head>
  <title>sharebox · アクセスが拒否されました</title>
</svelte:head>

<section class="mx-auto flex max-w-md flex-col items-center gap-5 py-20 text-center">
  <span
    class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2e6] text-[#dd5b00]"
    aria-hidden="true"
  >
    <Icon name="alert-circle" size={26} />
  </span>
  <h1 class="text-[32px] leading-[1.05] font-bold tracking-[-1px]">アクセスが拒否されました</h1>
  <p class="text-secondary-text text-[16px] leading-relaxed">
    このメールアドレスは sharebox の利用許可リストに登録されていません。本人のアカウントで再度ログインしてください。
  </p>
  <Button variant="secondary" onclick={() => (location.href = '/login')}>
    ログイン画面に戻る
  </Button>
</section>
