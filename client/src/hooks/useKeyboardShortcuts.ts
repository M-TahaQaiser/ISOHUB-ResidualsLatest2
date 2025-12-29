import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        
        // Handle special case for '?' which is Shift+/ (browsers emit 'Slash' code with Shift)
        let keyMatch = false;
        if (shortcut.key === '?' && event.code === 'Slash' && event.shiftKey) {
          keyMatch = true;
        } else if (shortcut.key === '?' && event.key === '?') {
          // Fallback for browsers that do emit '?'
          keyMatch = true;
        } else if (event.key && shortcut.key) {
          // Only compare if both keys exist
          keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        }

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export const GLOBAL_SHORTCUTS: ShortcutConfig[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Open global search',
    action: () => {} // Will be overridden
  },
  {
    key: '/',
    description: 'Focus search input',
    action: () => {} // Will be overridden
  },
  {
    key: 'n',
    ctrl: true,
    description: 'Create new item',
    action: () => {} // Will be overridden
  },
  {
    key: 's',
    ctrl: true,
    description: 'Save current form',
    action: () => {} // Will be overridden
  },
  {
    key: 'Escape',
    description: 'Close modal/dialog',
    action: () => {} // Will be overridden
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    action: () => {} // Will be overridden
  }
];
