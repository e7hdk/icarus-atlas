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

    let removeGesture = () => {};
    const beginPlay = () => {
      audio.volume = 0;
      audio
        .play()
        .then(() => rampTo(volumeRef.current, FADE_IN_MS))
        .catch(() => {
          // Autoplay blocked — arm the first user gesture to start the score.
          const onGesture = () => {
            audio.volume = 0;
            audio.play().then(() => rampTo(volumeRef.current, FADE_IN_MS)).catch(() => {});
          };
          window.addEventListener('pointerdown', onGesture, { once: true });
          window.addEventListener('keydown', onGesture, { once: true });
          window.addEventListener('touchstart', onGesture, { once: true });
          removeGesture = () => {
            window.removeEventListener('pointerdown', onGesture);
            window.removeEventListener('keydown', onGesture);
            window.removeEventListener('touchstart', onGesture);
          };
        });
    };
    beginPlay();

    return () => {
      removeGesture();
      stopRamp();
    };
  }, [enabled, rampTo, stopRamp]);

  return <audio ref={audioRef} src={SRC} loop preload="auto" aria-hidden />;
}
