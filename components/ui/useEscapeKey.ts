'use client';
import { useEffect } from 'react';

// Close a modal/menu when the user presses Escape (only while `active`).
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}
