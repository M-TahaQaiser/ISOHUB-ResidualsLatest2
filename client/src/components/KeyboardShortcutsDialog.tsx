import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts: Shortcut[] = [
    { keys: ['Ctrl', 'K'], description: 'Open command palette', category: 'Navigation' },
    { keys: ['Ctrl', 'E'], description: 'Export data to CSV (Reports)', category: 'Actions' },
    { keys: ['Ctrl', 'F'], description: 'Toggle filter panel (Reports)', category: 'Actions' },
    { keys: ['Esc'], description: 'Close modal/dialog', category: 'Navigation' },
    { keys: ['Shift', '?'], description: 'Show this help', category: 'Help' },
  ];

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-keyboard-shortcuts">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate faster and boost your productivity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-gray-700 mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <Badge
                            key={keyIdx}
                            variant="outline"
                            className="font-mono text-xs px-2 py-1"
                            data-testid={`badge-shortcut-${key.toLowerCase()}`}
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-gray-600">
            💡 <span className="font-semibold">Tip:</span> Most shortcuts work on Mac with Cmd instead of Ctrl
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
