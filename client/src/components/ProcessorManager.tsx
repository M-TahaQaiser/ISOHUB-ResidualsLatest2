import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Building } from "lucide-react";

const processorSchema = z.object({
  name: z.string().min(1, "Processor name is required"),
  isActive: z.boolean().default(true),
});

type ProcessorForm = z.infer<typeof processorSchema>;

export default function ProcessorManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProcessor, setEditingProcessor] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: processors, isLoading } = useQuery({
    queryKey: ["/api/processors"],
  });

  const form = useForm<ProcessorForm>({
    resolver: zodResolver(processorSchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProcessorForm) => {
      const response = await fetch("/api/processors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create processor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Processor created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/processors"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create processor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProcessorForm> }) => {
      const response = await fetch(`/api/processors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update processor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Processor updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/processors"] });
      setEditingProcessor(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update processor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/processors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle processor status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update processor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProcessorForm) => {
    if (editingProcessor) {
      updateMutation.mutate({ id: editingProcessor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (processor: any) => {
    setEditingProcessor(processor);
    form.reset({
      name: processor.name,
      isActive: processor.isActive,
    });
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingProcessor(null);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Processor Management</CardTitle>
          <Dialog open={isCreateOpen || !!editingProcessor} onOpenChange={closeDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Processor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProcessor ? "Edit Processor" : "Add New Processor"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter processor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Enable this processor for file uploads
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? "Saving..." 
                        : editingProcessor 
                        ? "Update" 
                        : "Create"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : processors && processors.length > 0 ? (
          <div className="space-y-4">
            {processors.map((processor: any) => (
              <div key={processor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{processor.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(processor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge variant={processor.isActive ? "default" : "secondary"}>
                    {processor.isActive ? "Active" : "Inactive"}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={processor.isActive}
                      onCheckedChange={(isActive) => 
                        toggleActiveMutation.mutate({ id: processor.id, isActive })
                      }
                      disabled={toggleActiveMutation.isPending}
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(processor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No processors configured yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Processor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
