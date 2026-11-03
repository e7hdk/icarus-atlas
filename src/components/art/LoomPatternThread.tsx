'use client';

import { useEffect, useRef } from 'react';
import type { LoomDoor } from '@/features/art/door';
import type { LoomCamera } from '@/features/art/loomCamera';
import { useLoomStore } from '@/features/art/store';

/** How long the thread takes to fall through its stops. */
const DRAW_MS = 1400;

/** A shown Pattern's gold thread (docs/LOOM_PLAN.md §3): it falls through its stops,
 *  oldest first, in screen space from each stop's projected centre, so it follows the
 *  camera wherever it looks. It steps aside while a web is held or the cloth is
 *  turned, and draws only when something it shows has moved. */
export function LoomPatternThread({
  door,
  rig,
  subscribe,
}: {
  door: LoomDoor;
  rig: LoomCamera;
  subscribe: (listener: () => void) => () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shown: number | null = null;
    let started = 0;
    let drawnFor = '';

    return subscribe(() => {
      const { pattern, focus, face } = useLoomStore.getState();
      if (pattern !== shown) {
        shown = pattern;
        started = performance.now();
      }
      // Mid-turn the cloth is edge-on, and from behind the thread is out of sight.
      const square = Math.min(1, Math.max(0, (Math.cos(rig.yaw) - 0.55) / 0.3));
      const visible = pattern !== null && focus === null && !face && square > 0;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(rig.viewWidth * ratio);
      const height = Math.round(rig.viewHeight * ratio);
      const progress = reduced ? 1 : Math.min(1, (performance.now() - started) / DRAW_MS);
      const key = visible
        ? [pattern, width, height, rig.x, rig.y, rig.s, rig.yaw, rig.pitch, progress].join()
        : 'hidden';
      if (key === drawnFor) return;
      drawnFor = key;
      if (element.width !== width || element.height !== height) {
        element.width = width;
        element.height = height;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rig.viewWidth, rig.viewHeight);
      if (!visible || pattern === null) return;

      const points = door.patterns[pattern].stops.map(({ work }) => {
        const { x, row, w, h } = door.works[work];
        const [sx, sy] = rig.toScreen(x + w / 2, row + h / 2);
        return [sx, sy] as const;
      });
      if (points.length < 2) return;
      const path = new Path2D();
      path.moveTo(points[0][0], points[0][1]);
      let length = 0;
      for (let index = 1; index < points.length; index++) {
        const [x0, y0] = points[index - 1];
        const [x1, y1] = points[index];
        // Leaving each stop downward and arriving from above, so the thread only falls.
        const bend = (y1 - y0) * 0.55;
        path.bezierCurveTo(x0, y0 + bend, x1, y1 - bend, x1, y1);
        length += Math.hypot(x1 - x0, y1 - y0) * 1.4;
      }
      const eased = 1 - (1 - progress) ** 3;
      context.globalAlpha = square;
      context.setLineDash([length * eased, length]);
      context.strokeStyle = 'rgba(252, 211, 77, 0.28)';
      context.lineWidth = 6;
      context.stroke(path);
      context.strokeStyle = '#fde68a';
      context.shadowColor = 'rgba(252, 211, 77, 0.95)';
      context.shadowBlur = 10;
      context.lineWidth = 1.5;
      context.stroke(path);
      context.setLineDash([]);
      // A stop lights once the thread has reached it.
      for (const [x, y] of points.slice(0, Math.ceil(eased * points.length))) {
        context.beginPath();
        context.arc(x, y, 3.4, 0, Math.PI * 2);
        context.fillStyle = '#05020f';
        context.fill();
        context.stroke();
      }
      context.shadowBlur = 0;
      context.globalAlpha = 1;
    });
  }, [door, rig, subscribe]);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
