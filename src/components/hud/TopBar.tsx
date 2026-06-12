'use client';

import { MainNav } from '@/components/hud/MainNav';
import type { MainTab } from '@/components/hud/MainNav';
import { HudActions } from '@/components/hud/HudActions';
import { IcarusBrand } from '@/components/ui/IcarusBrand';

export function TopBar({ active = 'galaxy' }: { active?: MainTab }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center px-4 py-3 sm:px-6 sm:py-4">
      <IcarusBrand />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <MainNav active={active} />
      </div>
      <HudActions />
    </header>
  );
}
