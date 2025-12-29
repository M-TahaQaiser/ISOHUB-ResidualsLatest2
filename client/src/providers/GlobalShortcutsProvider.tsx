import { useState, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';

interface GlobalShortcutsProviderProps {
  children: ReactNode;
}

export function GlobalShortcutsProvider({ children }: GlobalShortcutsProviderProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Global keyboard shortcuts that work everywhere
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Open command palette',
      action: () => setShowCommandPalette(true)
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsDialog(true)
    },
    {
      key: 'Escape',
      description: 'Close dialogs',
      action: () => {
        setShowCommandPalette(false);
        setShowShortcutsDialog(false);
      }
    }
  ]);

  return (
    <>
      {children}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
      />
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />
    </>
  );
}
