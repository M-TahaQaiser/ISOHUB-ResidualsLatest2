import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Users, UserCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateUSA } from "@/utils/dateFormat";

interface Rep {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "Manager" | "Team Leaders" | "Users/Reps" | "Team Member" | "Partners";
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  merchantCount?: number;
}

const ORGANIZATION_ID = "org-86f76df1";

export default function RepManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Rep | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reps
  const { data: repsData, isLoading } = useQuery({
    queryKey: ["/api/iso-ai/reps"],
    queryFn: async () => {
      const response = await fetch(`/api/iso-ai/reps?organizationId=${ORGANIZATION_ID}`);
      if (!response.ok) throw new Error("Failed to fetch reps");
      return response.json();
    },
  });

  // Create rep mutation
  const createMutation = useMutation({
    mutationFn: async (repData: Partial<Rep>) => {
      const response = await fetch("/api/iso-ai/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...repData,
          organizationId: ORGANIZATION_ID,
        }),
      });
      if (!response.ok) throw new Error("Failed to create rep");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/reps"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Rep Created",
        description: "New rep has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update rep mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rep> & { id: string }) => {
      const response = await fetch(`/api/iso-ai/reps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update rep");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/reps"] });
      setEditingRep(null);
      toast({
        title: "Rep Updated",
        description: "Rep information has been updated successfully.",
      });
    },
  });

  // Delete rep mutation
  const deleteMutation = useMutation({
    mutationFn: async (repId: string) => {
      const response = await fetch(`/api/iso-ai/reps/${repId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete rep");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/reps"] });
      toast({
        title: "Rep Deactivated",
        description: "Rep has been deactivated successfully.",
      });
    },
  });

  const reps = repsData?.reps || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const repData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as Rep["role"],
    };

    if (editingRep) {
      updateMutation.mutate({ id: editingRep.id, ...repData });
    } else {
      createMutation.mutate(repData);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SuperAdmin": return "destructive";
      case "Admin": return "destructive";
      case "Manager": return "default";
      case "Team Leaders": return "secondary";
      case "Users/Reps": return "outline";
      case "Team Member": return "outline";
      case "Partners": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Rep Management</h1>
            <p className="text-gray-400 mt-2">Manage your reps and their roles</p>
          </div>
          
          <Dialog open={isAddDialogOpen || !!editingRep} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingRep(null);
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Rep
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-yellow-400/20">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingRep ? "Edit Rep" : "Add New Rep"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingRep ? "Update rep information" : "Add a new rep to your organization"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={editingRep?.firstName}
                      required
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={editingRep?.lastName}
                      required
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingRep?.email}
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-gray-300">Role</Label>
                  <Select name="role" defaultValue={editingRep?.role || "Users/Reps"}>
                    <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-yellow-400/30">
                      <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Team Leaders">Team Leaders</SelectItem>
                      <SelectItem value="Users/Reps">Users/Reps</SelectItem>
                      <SelectItem value="Team Member">Team Member</SelectItem>
                      <SelectItem value="Partners">Partners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t border-yellow-400/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingRep(null);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingRep ? "Update" : "Create"} Rep
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Reps</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reps.length}</div>
              <p className="text-xs text-gray-400">Active sales reps</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Reps</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {reps.filter((r: Rep) => r.isActive).length}
              </div>
              <p className="text-xs text-gray-400">Currently active</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Roles</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">7</div>
              <p className="text-xs text-gray-400">Available role types</p>
            </CardContent>
          </Card>
        </div>

        {/* Reps Table */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="text-white">Reps</CardTitle>
            <CardDescription className="text-gray-400">
              Manage all reps in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-400">Loading reps...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/20 hover:bg-zinc-800/50">
                    <TableHead className="text-gray-300">Name</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Merchants</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reps.map((rep: Rep) => (
                    <TableRow key={rep.id} className="border-yellow-400/20 hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-white">
                        {rep.firstName} {rep.lastName}
                      </TableCell>
                      <TableCell className="text-gray-300">{rep.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(rep.role)}>
                          {rep.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rep.isActive ? "default" : "secondary"}>
                          {rep.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{rep.merchantCount || 0}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRep(rep)}
                            className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(rep.id)}
                            disabled={deleteMutation.isPending}
                            className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!isLoading && reps.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No reps found</h3>
                <p className="text-gray-400 mb-4">Get started by adding your first rep</p>
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Rep
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}