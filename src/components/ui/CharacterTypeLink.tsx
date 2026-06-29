'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CharacterType } from '@/types/character';
import { TYPE_GLOW } from '@/types/character';

/** Link to a character codex page, tinted in the figure's galaxy type glow. */
export function CharacterTypeLink({
  id,
  name,
  type,
  className,
}: {
  id: string;
  name: string;
  type: CharacterType;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const { color } = TYPE_GLOW[type];

  return (
    <Link
      href={`/character/${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`transition-[text-shadow,color] duration-100 hover:underline ${className ?? ''}`}
      style={{
        color,
        textShadow: hovered ? `0 0 12px ${color}` : `0 0 6px ${color}66`,
      }}
    >
      {name}
    </Link>
  );
}
