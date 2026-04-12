<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'pill';
  type Size = 'md' | 'sm';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-1.5 font-semibold transition-transform transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95]';

  const sizing: Record<Size, string> = {
    md: 'h-9 px-4 text-[15px]',
    sm: 'h-8 px-3 text-[14px]'
  };

  const variantClasses: Record<Variant, string> = {
    primary:
      'bg-accent text-white rounded-[var(--radius-micro)] hover:bg-accent-hover hover:scale-[1.03]',
    secondary:
      'bg-black/[0.05] text-primary-text rounded-[var(--radius-micro)] hover:bg-black/[0.08] hover:scale-[1.03]',
    ghost:
      'bg-transparent text-primary-text rounded-[var(--radius-micro)] hover:bg-black/[0.05] hover:underline',
    pill: 'bg-badge-bg text-badge-text rounded-[var(--radius-pill)] tracking-[0.125px] h-7 px-3 text-[12px]'
  };
</script>

<button
  {type}
  class="{base} {sizing[size]} {variantClasses[variant]} {className}"
  {...rest}
>
  {@render children()}
</button>
