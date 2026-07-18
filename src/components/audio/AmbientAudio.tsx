'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useEphemerisStore } from '@/features/spotlight/store';
import { useVoyageAudioStore } from '@/features/voyage/store';

/** The looping ambient score, and the Proem's own theme. While the Proem
 *  plays (docs/EPHEMERIS_PLAN.md §6) the ambient bed crossfades into the
 *  theme and hands back on exit. A missing proem.mp3 degrades silently —
 *  the crossfade only happens once the theme has actually started. */
const AMBIENT_SRC = '/audio/icarus-atlas.mp3';
const PROEM_SRC = '/audio/proem.mp3';
const FADE_IN_MS = 1600;
const FADE_OUT_MS = 600;
const CROSSFADE_MS = 1200;

type RampHolder = { current: number | null };

/** Two global audio elements, mounted once in the root layout so the score
 *  plays unbroken across every route. Honours the persisted enabled/volume
 *  preferences, and works around browser autoplay policy by starting on the
 *  first user gesture when an immediate play() is refused. */
export function AmbientAudio() {
  const ambientRef = useRef<HTMLAudioElement>(null);
  const proemRef = useRef<HTMLAudioElement>(null);
  const ambientRamp = useRef<number | null>(null);
  const proemRamp = useRef<number | null>(null);
  const enabled = useGalaxyStore((s) => s.musicEnabled);
  const volume = useGalaxyStore((s) => s.musicVolume);
  const proemActive = useEphemerisStore((s) => s.proemActive);
  // Latest targets, readable inside async play callbacks.
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  const proemActiveRef = useRef(proemActive);
  useEffect(() => {
    proemActiveRef.current = proemActive;
  }, [proemActive]);
  // While the Odyssey voyage plays its own mood stems, the atlas bed ducks out
  // (docs/NOSTOS_PLAN.md §8) and hands back when the reader leaves the route.
  const voyageActive = useVoyageAudioStore((s) => s.active);
  const voyageActiveRef = useRef(voyageActive);
  useEffect(() => {
    voyageActiveRef.current = voyageActive;
  }, [voyageActive]);

  const stopRamp = useCallback((holder: RampHolder) => {
    if (holder.current !== null) {
      cancelAnimationFrame(holder.current);
      holder.current = null;
    }
  }, []);

  const rampTo = useCallback(
    (
      audio: HTMLAudioElement | null,
      holder: RampHolder,
      target: number,
      ms: number,
      onDone?: () => void,
    ) => {
      if (!audio) return;
      stopRamp(holder);
      const from = audio.volume;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / ms, 1);
        audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
        if (t < 1) holder.current = requestAnimationFrame(tick);
        else {
          holder.current = null;
          onDone?.();
        }
      };
      holder.current = requestAnimationFrame(tick);
    },
    [stopRamp],
  );

  // Live volume changes from the slider apply at once to whichever bed plays.
  useEffect(() => {
    if (!enabled || voyageActive) return;
    const active = proemActive ? proemRef.current : ambientRef.current;
    const holder = proemActive ? proemRamp : ambientRamp;
    if (active && !active.paused) {
      stopRamp(holder);
      active.volume = volume;
    }
  }, [volume, enabled, proemActive, voyageActive, stopRamp]);

  // Play / pause on the enabled toggle, fading either way.
  useEffect(() => {
    const ambient = ambientRef.current;
    const proem = proemRef.current;
    if (!ambient || !proem) return;

    if (!enabled) {
      rampTo(ambient, ambientRamp, 0, FADE_OUT_MS, () => ambient.pause());
      rampTo(proem, proemRamp, 0, FADE_OUT_MS, () => proem.pause());
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
      // On the voyage the stem mixer owns the sound — nothing to raise here.
      if (voyageActiveRef.current) return;
      // Mid-proem re-enable belongs to the theme; the proem effect below
      // handles the hand-back when the stage folds.
      const target = proemActiveRef.current ? proem : ambient;
      const holder = proemActiveRef.current ? proemRamp : ambientRamp;
      target.volume = 0;
      target
        .play()
        ?.then(() => {
          // A slow-resolving play() must not raise the bed after the reader
          // has meanwhile entered the voyage (its mixer owns the sound).
          if (cancelled || voyageActiveRef.current) {
            target.pause();
            return;
          }
          rampTo(target, holder, volumeRef.current, FADE_IN_MS);
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
      stopRamp(ambientRamp);
      stopRamp(proemRamp);
    };
  }, [enabled, rampTo, stopRamp]);

  // The Proem crossfade. Entering the stage is a user gesture (Begin the
  // proem / the ?proem=1 click chain), so play() normally resolves at once;
  // when it can't (cold ?proem=1 load), the first advance click retries.
  useEffect(() => {
    const ambient = ambientRef.current;
    const proem = proemRef.current;
    if (!ambient || !proem || !enabled) return;
    let cancelled = false;

    if (proemActive) {
      const events = ['pointerdown', 'keydown', 'click'] as const;
      const opts: AddEventListenerOptions = { capture: true };
      let removed = false;
      const removeGesture = () => {
        if (removed) return;
        removed = true;
        for (const type of events) window.removeEventListener(type, onGesture, opts);
      };
      const attempt = () => {
        proem.volume = 0;
        proem.currentTime = 0;
        proem
          .play()
          ?.then(() => {
            if (cancelled) {
              proem.pause();
              return;
            }
            rampTo(proem, proemRamp, volumeRef.current, CROSSFADE_MS);
            rampTo(ambient, ambientRamp, 0, CROSSFADE_MS, () => ambient.pause());
            removeGesture();
          })
          .catch(() => {
            // Missing proem.mp3 or blocked autoplay — the ambient bed keeps
            // playing; an armed gesture retries the theme harmlessly.
          });
      };
      const onGesture = () => attempt();
      attempt();
      for (const type of events) window.addEventListener(type, onGesture, opts);
      return () => {
        cancelled = true;
        removeGesture();
      };
    }

    // Stage folded — hand back to the ambient bed. Never while the voyage
    // plays its stems: this branch also fires on plain mount (proem inactive),
    // and without the guard it would resurrect the bed over the mixer.
    if (!proem.paused) {
      rampTo(proem, proemRamp, 0, FADE_OUT_MS, () => {
        proem.pause();
        proem.currentTime = 0;
      });
    }
    if (voyageActiveRef.current) {
      return () => {
        cancelled = true;
      };
    }
    if (ambient.paused) {
      ambient
        .play()
        ?.then(() => {
          if (cancelled || voyageActiveRef.current) {
            ambient.pause();
            return;
          }
          rampTo(ambient, ambientRamp, volumeRef.current, CROSSFADE_MS);
        })
        .catch(() => {});
    } else {
      rampTo(ambient, ambientRamp, volumeRef.current, CROSSFADE_MS);
    }
    return () => {
      cancelled = true;
    };
  }, [proemActive, enabled, rampTo, stopRamp]);

  // The voyage duck: fade the atlas bed out while /odyssey plays its stems,
  // and fade back in when the reader returns to the rest of the atlas.
  useEffect(() => {
    const ambient = ambientRef.current;
    if (!ambient || !enabled) return;
    let cancelled = false;

    if (voyageActive) {
      if (!ambient.paused) {
        rampTo(ambient, ambientRamp, 0, CROSSFADE_MS, () => ambient.pause());
      } else {
        // Aborts any still-pending play() promise (its .then guards re-check
        // the voyage flag, and pausing makes the promise reject harmlessly).
        ambient.pause();
        ambient.volume = 0;
      }
      return () => {
        cancelled = true;
      };
    }

    if (proemActiveRef.current) return;
    if (ambient.paused) {
      ambient
        .play()
        ?.then(() => {
          if (cancelled) return;
          rampTo(ambient, ambientRamp, volumeRef.current, CROSSFADE_MS);
        })
        .catch(() => {
          // Autoplay still blocked — the enabled-effect's armed gesture covers it.
        });
    } else {
      rampTo(ambient, ambientRamp, volumeRef.current, CROSSFADE_MS);
    }
    return () => {
      cancelled = true;
    };
  }, [voyageActive, enabled, rampTo]);

  return (
    <>
      <audio ref={ambientRef} src={AMBIENT_SRC} loop preload="auto" aria-hidden />
      <audio ref={proemRef} src={PROEM_SRC} loop preload="none" aria-hidden />
    </>
  );
}
