import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";

interface RosterSelectorProps {
  role: 'agents' | 'partners' | 'managers' | 'companies' | 'associations';
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RosterSelector({ 
  role, 
  value, 
  onChange, 
  placeholder = "Select...",
  className 
}: RosterSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // Fetch roster data for the specific role
  const { data: rosterData, isLoading, refetch, error } = useQuery({
    queryKey: [`/api/roster/${role}`],
    queryFn: async () => {
      const response = await fetch(`/api/roster/${role}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${role} roster`);
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!role
  });

  // Log for debugging
  console.log(`RosterSelector for ${role}:`, {
    isLoading,
    rosterData,
    error,
    dataLength: rosterData?.length
  });

  const handleAddNew = async () => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`/api/roster/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (response.ok) {
        setNewName("");
        setIsAddDialogOpen(false);
        refetch();
        onChange(newName.trim());
      }
    } catch (error) {
      console.error('Error adding to roster:', error);
    }
  };

  const roleLabels = {
    agents: 'Agent',
    partners: 'Partner', 
    managers: 'Manager',
    companies: 'Company',
    associations: 'Association'
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="z-50">
          {!isLoading && rosterData?.map((name: string) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="px-3"
            title={`Add new ${roleLabels[role].toLowerCase()}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {roleLabels[role]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter ${roleLabels[role].toLowerCase()} name`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNew();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNew}
                disabled={!newName.trim()}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Add {roleLabels[role]}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}