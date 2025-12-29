import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organization {
  id: number;
  name: string;
  organizationId: string;
  status: 'setup' | 'onboarding' | 'active' | 'inactive' | 'suspended';
  createdAt: string;
  industry?: string;
  adminContactName?: string;
  adminContactEmail?: string;
}

interface OrganizationSelectorProps {
  selectedOrganization?: Organization;
  onOrganizationSelect: (organization: Organization) => void;
  placeholder?: string;
}

export default function OrganizationSelector({ selectedOrganization, onOrganizationSelect, placeholder = "Select organization..." }: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch organizations from the onboarding organizations table
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['/api/onboarding/organizations'],
    queryFn: () => apiRequest('/api/onboarding/organizations')
  });

  const filteredOrganizations = organizations.filter((organization: Organization) =>
    organization?.name?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
    organization?.organizationId?.toLowerCase()?.includes(searchValue.toLowerCase()) ||
    organization?.industry?.toLowerCase()?.includes(searchValue.toLowerCase())
  );

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-medium text-gray-300">Organization:</span>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            role="combobox"
            aria-expanded={open}
            className="w-[400px] flex items-center justify-between px-4 py-2 rounded-md bg-zinc-800 border border-yellow-400/30 text-white hover:bg-zinc-700 hover:text-white hover:border-yellow-400/50 transition-colors"
          >
            {selectedOrganization ? (
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedOrganization.name}</span>
                  <span className="text-xs text-gray-400">
                    {selectedOrganization.organizationId} • {selectedOrganization.industry || 'No industry set'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0 bg-zinc-900 border border-yellow-400/30 shadow-lg" align="start">
          <Command className="bg-zinc-900">
            <div className="flex items-center border-b border-yellow-400/20 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <CommandInput
                placeholder="Search organizations..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="border-0 focus:ring-0 bg-transparent text-white"
              />
            </div>
            
            <CommandEmpty className="text-gray-400">No organizations found.</CommandEmpty>
            
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              <div className="px-2 py-1.5">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  All Accounts ({filteredOrganizations.length})
                </div>
              </div>
              
              {filteredOrganizations.map((organization: Organization) => (
                <CommandItem
                  key={organization.id}
                  value={`${organization.name} ${organization.organizationId} ${organization.industry || ''}`}
                  onSelect={() => {
                    onOrganizationSelect(organization);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="font-medium text-white">{organization.name}</div>
                      <div className="text-sm text-gray-400">
                        {organization.organizationId} • {organization.industry || 'No industry set'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {organization.adminContactName || 'No contact'} • {organization.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      organization.status === 'active' ? 'bg-green-500' :
                      organization.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-yellow-400",
                        selectedOrganization?.id === organization.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {!isLoading && filteredOrganizations.length === 0 && searchValue && (
              <div className="p-4 text-center text-gray-400">
                <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No organizations match "{searchValue}"</p>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedOrganization && (
        <button
          onClick={() => onOrganizationSelect(null as any)}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-md transition-colors"
        >
          Clear Selection
        </button>
      )}
    </div>
  );
}