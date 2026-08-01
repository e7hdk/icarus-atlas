import {
  events as createPointerEvents,
  type EventManager,
  type RootStore,
} from '@react-three/fiber';
import { matchesMobileDevice, MOBILE_TAP_SLOP } from '@/lib/useIsMobile';

/**
 * Desktop delegates byte-for-byte to R3F's standard pointer manager. On mobile,
 * CameraControls still receives native gestures, while scene picking runs once
 * at the end of a true tap instead of on every pointer move/down/up.
 */
export function createGalaxyPointerEvents(store: RootStore): EventManager<HTMLElement> {
  const manager = createPointerEvents(store);
  const handlers = manager.handlers;
  if (!handlers) return manager;

  const original = { ...handlers };
  const originalUpdate = manager.update;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let cancelled = false;
  let tapReady = false;
  let tapExpiry: number | null = null;

  const clearTapExpiry = () => {
    if (tapExpiry !== null) window.clearTimeout(tapExpiry);
    tapExpiry = null;
  };
  const reset = () => {
    clearTapExpiry();
    pointerId = null;
    cancelled = false;
    tapReady = false;
  };
  const isSceneEvent = (event: Event) => event.target === store.getState().gl.domElement;

  handlers.onPointerDown = (event) => {
    if (!matchesMobileDevice()) {
      original.onPointerDown?.(event);
      return;
    }
    if (!isSceneEvent(event)) {
      reset();
      return;
    }
    const pointer = event as PointerEvent;
    clearTapExpiry();
    tapReady = false;
    if (pointerId !== null && pointerId !== pointer.pointerId) {
      cancelled = true;
      return;
    }
    pointerId = pointer.pointerId;
    startX = pointer.clientX;
    startY = pointer.clientY;
    cancelled = false;
  };

  handlers.onPointerMove = (event) => {
    if (!matchesMobileDevice()) {
      original.onPointerMove?.(event);
      return;
    }
    const pointer = event as PointerEvent;
    if (pointer.pointerId !== pointerId || cancelled) return;
    const dx = pointer.clientX - startX;
    const dy = pointer.clientY - startY;
    if (dx * dx + dy * dy > MOBILE_TAP_SLOP * MOBILE_TAP_SLOP) cancelled = true;
  };

  handlers.onPointerUp = (event) => {
    if (!matchesMobileDevice()) {
      original.onPointerUp?.(event);
      return;
    }
    const pointer = event as PointerEvent;
    if (pointer.pointerId !== pointerId) return;
    const dx = pointer.clientX - startX;
    const dy = pointer.clientY - startY;
    tapReady =
      !cancelled &&
      dx * dx + dy * dy <= MOBILE_TAP_SLOP * MOBILE_TAP_SLOP &&
      isSceneEvent(event);
    pointerId = null;
    cancelled = false;
    clearTapExpiry();
    tapExpiry = window.setTimeout(() => {
      tapReady = false;
      tapExpiry = null;
    }, 500);
  };

  handlers.onClick = (event) => {
    if (!matchesMobileDevice()) {
      original.onClick?.(event);
      return;
    }
    if (!tapReady || !isSceneEvent(event)) {
      reset();
      return;
    }
    tapReady = false;
    clearTapExpiry();

    // R3F normally records the hit set on pointerdown, which costs a full
    // instanced raycast before every drag. A mobile tap has already passed the
    // movement gate, so all interactive objects are valid initial candidates;
    // the standard click handler now performs the one real, distance-sorted pick.
    const mouse = event as MouseEvent;
    const state = store.getState();
    state.internal.initialClick = [mouse.offsetX, mouse.offsetY];
    state.internal.initialHits = [...state.internal.interaction];
    original.onClick?.(event);
  };

  const cancelPointer = (
    event: Event,
    originalHandler?: EventListener,
    preserveCompletedTap = false,
  ) => {
    if (!matchesMobileDevice()) {
      originalHandler?.(event);
      return;
    }
    // Touch browsers release implicit pointer capture and may emit leave before
    // the synthesized click. Once pointerup accepted a tap, keep it armed for
    // that click; an interruption while the pointer is still down still cancels.
    if (!preserveCompletedTap || pointerId !== null) reset();
    // This path only clears R3F's existing hover bookkeeping; it does not raycast.
    originalHandler?.(event);
  };
  handlers.onPointerCancel = (event) => cancelPointer(event, original.onPointerCancel);
  handlers.onPointerLeave = (event) =>
    cancelPointer(event, original.onPointerLeave, true);
  handlers.onLostPointerCapture = (event) =>
    cancelPointer(event, original.onLostPointerCapture, true);
  handlers.onWheel = (event) => {
    if (!matchesMobileDevice()) original.onWheel?.(event);
  };
  handlers.onContextMenu = (event) => {
    if (!matchesMobileDevice()) original.onContextMenu?.(event);
  };
  handlers.onDoubleClick = (event) => {
    if (!matchesMobileDevice()) original.onDoubleClick?.(event);
  };
  manager.update = () => {
    if (!matchesMobileDevice()) originalUpdate?.();
  };

  return manager;
}
