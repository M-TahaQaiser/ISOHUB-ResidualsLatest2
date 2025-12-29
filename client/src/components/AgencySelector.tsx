import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface Agency {
  id: string;
  name: string;
  agencyCode: string;
  organizationId: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  location?: string;
  agentCount?: number;
}

interface AgencySelectorProps {
  selectedAgency?: Agency;
  onAgencySelect: (agency: Agency) => void;
  placeholder?: string;
}

export default function AgencySelector({ selectedAgency, onAgencySelect, placeholder = "Select agency..." }: AgencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['/api/agencies/list'],
    queryFn: async () => {
      const response = await fetch('/api/agencies/list');
      if (!response.ok) {
        throw new Error('Failed to fetch agencies');
      }
      return response.json();
    }
  });

  // Initialize selected agency from localStorage when agencies are loaded
  useEffect(() => {
    if (agencies.length > 0 && !selectedAgency?.name) {
      // Check both possible localStorage keys for agency ID
      const storedOrgId = localStorage.getItem('selectedAgencyId') || localStorage.getItem('organizationID');
      if (storedOrgId) {
        const matchedAgency = agencies.find((agency: Agency) => 
          agency.organizationId === storedOrgId || agency.id === storedOrgId
        );
        if (matchedAgency) {
          console.log('Initializing selected agency from localStorage:', matchedAgency.name);
          onAgencySelect(matchedAgency);
        }
      }
    }
  }, [agencies, selectedAgency?.name, onAgencySelect]);

  const filteredAgencies = (agencies || []).filter((agency: Agency) =>
    agency?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    agency?.agencyCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
    agency?.location?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Agency:</span>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[400px] justify-between"
          >
            {selectedAgency ? (
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedAgency.name}</span>
                  <span className="text-xs text-gray-500">
                    {selectedAgency.agencyCode} • {selectedAgency.location || 'No location'}
                  </span>
                </div>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0 bg-white border border-gray-200 shadow-lg" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search agencies..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="border-0 focus:ring-0"
              />
            </div>
            
            <CommandEmpty>No agencies found.</CommandEmpty>
            
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              <div className="px-2 py-1.5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  All Accounts ({filteredAgencies.length})
                </div>
              </div>
              
              {filteredAgencies.map((agency: Agency) => (
                <CommandItem
                  key={agency.id}
                  value={`${agency.name} ${agency.agencyCode} ${agency.location || ''}`}
                  onSelect={() => {
                    onAgencySelect(agency);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900">{agency.name}</div>
                      <div className="text-sm text-gray-500">
                        {agency.agencyCode} • {agency.location || 'No location set'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {agency.agentCount || 0} agents • {agency.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      agency.status === 'active' ? 'bg-green-500' :
                      agency.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {!isLoading && filteredAgencies.length === 0 && searchValue && (
              <div className="p-4 text-center text-gray-500">
                <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No agencies match "{searchValue}"</p>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedAgency && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAgencySelect(null as any)}
          className="text-gray-500 hover:text-gray-700"
        >
          Switch to Agency View
        </Button>
      )}
    </div>
  );
}