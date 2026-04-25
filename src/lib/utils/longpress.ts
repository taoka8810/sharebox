import type { Action } from 'svelte/action';

interface LongpressOptions {
  duration?: number;
  onTrigger: () => void;
}

const MOVE_THRESHOLD_PX = 10;
const DEFAULT_DURATION_MS = 500;

export const longpress: Action<HTMLElement, LongpressOptions> = (node, params) => {
  let options = params;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let suppressClick = false;

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse') return;
    clearTimer();
    startX = e.clientX;
    startY = e.clientY;
    timer = setTimeout(() => {
      timer = null;
      suppressClick = true;
      try {
        navigator.vibrate?.(8);
      } catch {
        /* ignore */
      }
      options.onTrigger();
    }, options.duration ?? DEFAULT_DURATION_MS);
  }

  function onPointerMove(e: PointerEvent) {
    if (timer === null) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD_PX) {
      clearTimer();
    }
  }

  function onPointerEnd() {
    clearTimer();
  }

  function onClickCapture(e: MouseEvent) {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('click', onClickCapture, true);

  return {
    update(next: LongpressOptions) {
      options = next;
    },
    destroy() {
      clearTimer();
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('click', onClickCapture, true);
    }
  };
};
