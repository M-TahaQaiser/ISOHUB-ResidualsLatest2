import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, DollarSign, Users, Settings, Home, BarChart, Store, UserCircle } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description: string;
  action: () => void;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch search results when query changes
  const { data: searchResults } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return { merchants: [], processors: [], users: [] };
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  const commands: Command[] = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your dashboard',
      action: () => {
        setLocation('/dashboard');
        onOpenChange(false);
      },
      icon: <Home className="h-4 w-4" />,
      category: 'Navigation',
      keywords: ['home', 'overview', 'dashboard']
    },
    {
      id: 'nav-residuals',
      label: 'Go to Residuals',
      description: 'Manage residual processing',
      action: () => {
        setLocation('/residuals');
        onOpenChange(false);
      },
      icon: <DollarSign className="h-4 w-4" />,
      category: 'Navigation',
      keywords: ['residuals', 'processing', 'payments']
    },
    {
      id: 'nav-reports',
      label: 'Go to Reports',
      description: 'View and generate reports',
      action: () => {
        setLocation('/reports');
        onOpenChange(false);
      },
      icon: <FileText className="h-4 w-4" />,
      category: 'Navigation',
      keywords: ['reports', 'analytics', 'data']
    },
    {
      id: 'nav-agents',
      label: 'Go to Agent Management',
      description: 'Manage agents and partners',
      action: () => {
        setLocation('/agent-management');
        onOpenChange(false);
      },
      icon: <Users className="h-4 w-4" />,
      category: 'Navigation',
      keywords: ['agents', 'partners', 'users', 'team']
    },
    {
      id: 'nav-ai',
      label: 'Go to ISO-AI',
      description: 'AI assistant for merchant services',
      action: () => {
        setLocation('/iso-ai');
        onOpenChange(false);
      },
      icon: <BarChart className="h-4 w-4" />,
      category: 'Navigation',
      keywords: ['ai', 'artificial intelligence', 'analysis', 'insights', 'iso-ai', 'chat']
    }
  ];

  const filteredCommands = commands.filter((command) => {
    const query = searchQuery.toLowerCase();
    return (
      command.label.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query) ||
      command.keywords.some((keyword) => keyword.includes(query))
    );
  });

  const hasSearchResults = searchResults && (
    searchResults.merchants?.length > 0 || 
    searchResults.processors?.length > 0 || 
    searchResults.users?.length > 0
  );

  const categories = Array.from(new Set(filteredCommands.map((c) => c.category)));

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0" data-testid="dialog-command-palette">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Command Palette
          </DialogTitle>
          <DialogDescription>
            Search for pages, actions, and features
          </DialogDescription>
        </DialogHeader>

        <div className="border-t">
          <Input
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="input-command-search"
            autoFocus
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!hasSearchResults && categories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <>
              {/* Navigation Commands */}
              {categories.length > 0 && (
                <>
                  {categories.map((category) => (
                    <div key={category} className="mb-2">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {filteredCommands
                        .filter((c) => c.category === category)
                        .map((command) => (
                          <button
                            key={command.id}
                            onClick={command.action}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                            data-testid={`command-${command.id}`}
                          >
                            <span className="text-muted-foreground">{command.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{command.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {command.description}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  ))}
                </>
              )}

              {/* Search Results */}
              {hasSearchResults && (
                <>
                  {/* Merchants */}
                  {searchResults.merchants && searchResults.merchants.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Merchants
                      </div>
                      {searchResults.merchants.map((merchant: any) => (
                        <button
                          key={merchant.id}
                          onClick={() => {
                            // Navigate to residuals page (where merchants are managed)
                            setLocation('/residuals');
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                          data-testid={`search-merchant-${merchant.id}`}
                        >
                          <span className="text-muted-foreground"><Store className="h-4 w-4" /></span>
                          <div className="flex-1">
                            <div className="font-medium">{merchant.dba || merchant.legalName || merchant.mid}</div>
                            <div className="text-xs text-muted-foreground">
                              MID: {merchant.mid} {merchant.currentProcessor && `• ${merchant.currentProcessor}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Processors */}
                  {searchResults.processors && searchResults.processors.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Processors
                      </div>
                      {searchResults.processors.map((processor: any) => (
                        <button
                          key={processor.id}
                          onClick={() => {
                            // Navigate to reports page (where processor data is viewed)
                            setLocation('/reports');
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                          data-testid={`search-processor-${processor.id}`}
                        >
                          <span className="text-muted-foreground"><DollarSign className="h-4 w-4" /></span>
                          <div className="flex-1">
                            <div className="font-medium">{processor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {processor.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users (Agents/Partners) */}
                  {searchResults.users && searchResults.users.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Agents & Partners
                      </div>
                      {searchResults.users.map((user: any) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            // Navigate to agent management
                            setLocation('/agent-management');
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                          data-testid={`search-user-${user.id}`}
                        >
                          <span className="text-muted-foreground"><UserCircle className="h-4 w-4" /></span>
                          <div className="flex-1">
                            <div className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.role} {user.email && `• ${user.email}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs px-1">↑↓</Badge>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs px-1">Enter</Badge>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs px-1">Esc</Badge>
            <span>Close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
