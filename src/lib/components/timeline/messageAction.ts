import type { IconName } from '$lib/components/ui/Icon.svelte';

export interface MessageAction {
  label: string;
  icon: IconName;
  onSelect: () => void | Promise<void>;
  danger?: boolean;
}
