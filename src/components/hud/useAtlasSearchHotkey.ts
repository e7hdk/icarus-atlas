'use client';

import { useEffect } from 'react';
import { useGalaxyStore } from '@/features/galaxy/store';

/** Global ⌘K / Ctrl+K toggles the command palette; Escape closes search or settings. */
export function useAtlasSearchHotkey() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useGalaxyStore.getState();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        store.setSearchOpen(!store.searchOpen);
      } else if (event.key === 'Escape') {
        if (store.searchOpen) {
          event.preventDefault();
          store.setSearchOpen(false);
        } else if (store.settingsOpen) {
          event.preventDefault();
          store.setSettingsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
