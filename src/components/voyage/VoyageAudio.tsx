'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';
import { useVoyageAudioStore } from '@/features/voyage/store';
import type { VoyageMood } from '@/types/story';

/** The voyage's mood-stem mixer (docs/NOSTOS_PLAN.md §8, M13.4). Four looping
 *  beds — open sea, storm, hearth, the Sirens' song — crossfade as the reader
 *  sails between stations, so the storm breaks at Scylla and the fire crackles
 *  on Ithaca, never at random. Honours the same persisted enabled/volume
 *  preferences as the atlas score, arms on the first user gesture under
 *  autoplay policy, and degrades silently if a stem file is missing. The
 *  `silence` mood fades everything out — the overture and the bow ask for it. */

const STEM_SRC = {
  sea: '/audio/odyssey-sea.mp3',
  storm: '/audio/odyssey-storm.mp3',
  hearth: '/audio/odyssey-hearth.mp3',
  sirens: '/audio/odyssey-sirens.mp3',
} as const;

type StemId = keyof typeof STEM_SRC;
const STEM_IDS = Object.keys(STEM_SRC) as StemId[];

/** Station mood → stem. `null` = deliberate silence. */
const STEM_FOR: Record<VoyageMood, StemId | null> = {
  silence: null,
  'open-sea': 'sea',
  drift: 'sea',
  island: 'sea',
  hall: 'sea',
  storm: 'storm',
  dread: 'storm',
  underworld: 'storm',
  hearth: 'hearth',
  dawn: 'hearth',
  sirens: 'sirens',
};

/** Weather-slow crossfades — moods shift like the sea, not like a mixer. */
const CROSSFADE_MS = 2600;
const FADE_OUT_MS = 900;

type RampHolder = { current: number | null };

export function VoyageAudio() {
  const audioRefs = useRef<Record<StemId, HTMLAudioElement | null>>({
    sea: null,
    storm: null,
    hearth: null,
    sirens: null,
  });
  const rampRefs = useRef<Record<StemId, RampHolder>>({
    sea: { current: null },
    storm: { current: null },
    hearth: { current: null },
    sirens: { current: null },
  });
  const enabled = useGalaxyStore((s) => s.musicEnabled);
  const volume = useGalaxyStore((s) => s.musicVolume);
  const mood = useVoyageAudioStore((s) => s.mood);
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const stopRamp = useCallback((holder: RampHolder) => {
    if (holder.current !== null) {
      cancelAnimationFrame(holder.current);
      holder.current = null;
    }
  }, []);

  const rampTo = useCallback(
    (audio: HTMLAudioElement | null, holder: RampHolder, target: number, ms: number, onDone?: () => void) => {
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

  // Live volume changes apply at once to whichever stem is up.
  useEffect(() => {
    if (!enabled) return;
    for (const id of STEM_IDS) {
      const audio = audioRefs.current[id];
      if (audio && !audio.paused && audio.volume > 0.01) {
        stopRamp(rampRefs.current[id]);
        audio.volume = volume;
      }
    }
  }, [volume, enabled, stopRamp]);

  // The mixer: fade the target stem up, everything else down. Autoplay policy
  // is handled the AmbientAudio way — attempt at once AND arm the first
  // gesture, since mobile may leave the initial play() pending.
  useEffect(() => {
    const target = enabled && mood ? STEM_FOR[mood] : null;
    let cancelled = false;

    for (const id of STEM_IDS) {
      if (id === target) continue;
      const audio = audioRefs.current[id];
      if (audio && !audio.paused) {
        rampTo(audio, rampRefs.current[id], 0, FADE_OUT_MS, () => audio.pause());
      }
    }
    if (!target) return;

    const audio = audioRefs.current[target];
    if (!audio) return;
    const holder = rampRefs.current[target];

    const events = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'click'] as const;
    const opts: AddEventListenerOptions = { capture: true };
    let removed = false;
    const removeGesture = () => {
      if (removed) return;
      removed = true;
      for (const type of events) window.removeEventListener(type, onGesture, opts);
    };
    const attempt = () => {
      if (!audio.paused) {
        rampTo(audio, holder, volumeRef.current, CROSSFADE_MS);
        removeGesture();
        return;
      }
      // The Sirens' song always begins at its beginning.
      if (target === 'sirens') audio.currentTime = 0;
      audio.volume = 0;
      audio
        .play()
        ?.then(() => {
          if (cancelled) {
            audio.pause();
            return;
          }
          rampTo(audio, holder, volumeRef.current, CROSSFADE_MS);
          removeGesture();
        })
        .catch(() => {
          // Missing stem or blocked autoplay — the armed gesture retries.
        });
    };
    const onGesture = () => attempt();
    attempt();
    for (const type of events) window.addEventListener(type, onGesture, opts);

    return () => {
      cancelled = true;
      removeGesture();
    };
  }, [mood, enabled, rampTo]);

  // Unmount: the voyage ends — everything fades and stops.
  useEffect(() => {
    const audios = audioRefs.current;
    const ramps = rampRefs.current;
    return () => {
      for (const id of STEM_IDS) {
        const audio = audios[id];
        if (audio && !audio.paused) {
          rampTo(audio, ramps[id], 0, FADE_OUT_MS, () => audio.pause());
        }
      }
    };
  }, [rampTo]);

  return (
    <>
      {STEM_IDS.map((id) => (
        <audio
          key={id}
          ref={(el) => {
            audioRefs.current[id] = el;
          }}
          src={STEM_SRC[id]}
          loop
          preload={id === 'sea' ? 'auto' : 'none'}
          aria-hidden
        />
      ))}
    </>
  );
}
