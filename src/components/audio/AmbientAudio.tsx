'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';

/** The looping ambient score (public/audio/icarus-atlas.mp3). */
const SRC = '/audio/icarus-atlas.mp3';
const FADE_IN_MS = 1600;
const FADE_OUT_MS = 600;

/** A single global audio element, mounted once in the root layout so the score
 *  plays unbroken across every route. Honours the persisted enabled/volume
 *  preferences, and works around browser autoplay policy by starting on the
 *  first user gesture when an immediate play() is refused. */
export function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rampRef = useRef<number | null>(null);
  const enabled = useGalaxyStore((s) => s.musicEnabled);
  const volume = useGalaxyStore((s) => s.musicVolume);
  // Latest target volume, readable inside async play callbacks.
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const stopRamp = useCallback(() => {
    if (rampRef.current !== null) {
      cancelAnimationFrame(rampRef.current);
      rampRef.current = null;
    }
  }, []);

  const rampTo = useCallback(
    (target: number, ms: number, onDone?: () => void) => {
      const audio = audioRef.current;
      if (!audio) return;
      stopRamp();
      const from = audio.volume;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / ms, 1);
        audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
        if (t < 1) rampRef.current = requestAnimationFrame(tick);
        else {
          rampRef.current = null;
          onDone?.();
        }
      };
      rampRef.current = requestAnimationFrame(tick);
    },
    [stopRamp],
  );

  // Live volume changes from the slider apply at once while the score plays.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && enabled && !audio.paused) {
      stopRamp();
      audio.volume = volume;
    }
  }, [volume, enabled, stopRamp]);

  // Play / pause on the enabled toggle, fading either way.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!enabled) {
      rampTo(0, FADE_OUT_MS, () => audio.pause());
      return;
    }

    // Capture phase fires before the target's handlers, so a star/region/button
    // that calls stopPropagation can't swallow the first-gesture activation.
    // Android grants media activation on the "up/end" of a touch (and a pan has
    // no click at all), so listen for those too — not just the "down" events.
    const events = [
      'pointerdown',
      'pointerup',
      'touchstart',
      'touchend',
      'keydown',
      'click',
    ] as const;
    const opts: AddEventListenerOptions = { capture: true };
    let removed = false;
    // Torn down when `enabled` flips back to false (e.g. persisted state
    // rehydrates "off" after the default "on" first render). A play() promise
    // armed while enabled was true can resolve *after* that — without this guard
    // its .then() would ramp the volume back up and cancel the fade-out's pause,
    // leaving the score playing while the UI correctly reads "off".
    let cancelled = false;
    const removeGesture = () => {
      if (removed) return;
      removed = true;
      for (const type of events) window.removeEventListener(type, onGesture, opts);
    };
    const start = () => {
      audio.volume = 0;
      audio
        .play()
        ?.then(() => {
          if (cancelled) {
            audio.pause();
            return;
          }
          rampTo(volumeRef.current, FADE_IN_MS);
          removeGesture();
        })
        .catch(() => {
          // Blocked (or pending on mobile) — the armed gesture below will retry.
        });
    };
    const onGesture = () => start();

    // Try immediately (succeeds on desktop / once the site is trusted), AND
    // always arm the first gesture — mobile browsers may leave the initial
    // play() pending rather than rejecting, so we can't rely on the catch.
    start();
    for (const type of events) window.addEventListener(type, onGesture, opts);

    return () => {
      cancelled = true;
      removeGesture();
      stopRamp();
    };
  }, [enabled, rampTo, stopRamp]);

  return <audio ref={audioRef} src={SRC} loop preload="auto" aria-hidden />;
}
