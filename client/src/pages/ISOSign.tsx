import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileSignature, 
  Send, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Plus,
  Search,
  Eye,
  MoreHorizontal,
  RefreshCw,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface EnvelopeStats {
  draft: number;
  sent: number;
  inProgress: number;
  completed: number;
  declined: number;
  voided: number;
  expired: number;
}

interface Envelope {
  id: number;
  envelopeUuid: string;
  title: string;
  description?: string;
  status: string;
  sourceType?: string;
  senderName?: string;
  senderEmail?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;
}

interface EnvelopeListResponse {
  envelopes: Envelope[];
  total: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: "bg-zinc-700 text-gray-200 border border-zinc-600", icon: FileText, label: "Draft" },
  sent: { color: "bg-blue-900/50 text-blue-300 border border-blue-700", icon: Send, label: "Sent" },
  in_progress: { color: "bg-yellow-900/50 text-yellow-300 border border-yellow-700", icon: Clock, label: "In Progress" },
  completed: { color: "bg-green-900/50 text-green-300 border border-green-700", icon: CheckCircle, label: "Completed" },
  declined: { color: "bg-red-900/50 text-red-300 border border-red-700", icon: XCircle, label: "Declined" },
  voided: { color: "bg-zinc-700 text-gray-300 border border-zinc-600", icon: Trash2, label: "Voided" },
  expired: { color: "bg-orange-900/50 text-orange-300 border border-orange-700", icon: AlertTriangle, label: "Expired" },
};

export default function ISOSign() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEnvelopeTitle, setNewEnvelopeTitle] = useState("");
  const [newEnvelopeDescription, setNewEnvelopeDescription] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<EnvelopeStats>({
    queryKey: ["/api/iso-sign/stats"],
  });

  const envelopesQueryUrl = statusFilter !== "all" 
    ? `/api/iso-sign/envelopes?status=${statusFilter}&limit=50`
    : "/api/iso-sign/envelopes?limit=50";
    
  const { data: envelopesData, isLoading: envelopesLoading, refetch } = useQuery<EnvelopeListResponse>({
    queryKey: [envelopesQueryUrl],
  });

  const createEnvelopeMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      return apiRequest("/api/iso-sign/envelopes", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        String(query.queryKey[0]).startsWith("/api/iso-sign/envelopes") 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-sign/stats"] });
      setIsCreateDialogOpen(false);
      setNewEnvelopeTitle("");
      setNewEnvelopeDescription("");
      toast({
        title: "Envelope Created",
        description: "Your new envelope has been created. Add documents and recipients to proceed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create envelope",
        variant: "destructive",
      });
    },
  });

  const voidEnvelopeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest(`/api/iso-sign/envelopes/${id}/void`, {
        method: "POST",
        body: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        String(query.queryKey[0]).startsWith("/api/iso-sign/envelopes") 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/iso-sign/stats"] });
      toast({
        title: "Envelope Voided",
        description: "The envelope has been voided successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to void envelope",
        variant: "destructive",
      });
    },
  });

  const handleCreateEnvelope = () => {
    if (!newEnvelopeTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the envelope.",
        variant: "destructive",
      });
      return;
    }
    createEnvelopeMutation.mutate({
      title: newEnvelopeTitle,
      description: newEnvelopeDescription || undefined,
    });
  };

  const handleVoidEnvelope = (envelope: Envelope) => {
    if (confirm(`Are you sure you want to void "${envelope.title}"? This action cannot be undone.`)) {
      voidEnvelopeMutation.mutate({ id: envelope.id, reason: "Voided by user" });
    }
  };

  const filteredEnvelopes = (envelopesData?.envelopes || []).filter((envelope) =>
    envelope.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envelope.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const totalEnvelopes = stats
    ? stats.draft + stats.sent + stats.inProgress + stats.completed + stats.declined + stats.voided + stats.expired
    : 0;

  return (
    <div className="p-6 space-y-6 bg-black min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-yellow-400" />
            ISO-Sign
          </h1>
          <p className="text-gray-400 mt-1">
            Electronic signature management for commission agreements and contracts
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold" data-testid="button-create-envelope">
              <Plus className="h-4 w-4 mr-2" />
              New Envelope
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-zinc-900 border-yellow-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Envelope</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new envelope to collect signatures on documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Commission Agreement - John Smith"
                  value={newEnvelopeTitle}
                  onChange={(e) => setNewEnvelopeTitle(e.target.value)}
                  className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-500"
                  data-testid="input-envelope-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this envelope..."
                  value={newEnvelopeDescription}
                  onChange={(e) => setNewEnvelopeDescription(e.target.value)}
                  className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-500"
                  rows={3}
                  data-testid="input-envelope-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-zinc-700 text-gray-300 hover:bg-zinc-800" data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateEnvelope}
                disabled={createEnvelopeMutation.isPending}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                data-testid="button-confirm-create"
              >
                {createEnvelopeMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Envelope"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-zinc-900 border-yellow-400/20">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 bg-zinc-800" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="bg-zinc-900 border-yellow-400/20 cursor-pointer hover:border-yellow-400/50 transition-colors" onClick={() => setStatusFilter("all")} data-testid="card-stat-total">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Envelopes</CardTitle>
                <FileSignature className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalEnvelopes}</div>
                <p className="text-xs text-gray-500">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-yellow-400/20 cursor-pointer hover:border-blue-400/50 transition-colors" onClick={() => setStatusFilter("sent")} data-testid="card-stat-awaiting">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Awaiting Signature</CardTitle>
                <Clock className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{(stats?.sent || 0) + (stats?.inProgress || 0)}</div>
                <p className="text-xs text-gray-500">Pending action</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-yellow-400/20 cursor-pointer hover:border-green-400/50 transition-colors" onClick={() => setStatusFilter("completed")} data-testid="card-stat-completed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.completed || 0}</div>
                <p className="text-xs text-gray-500">Fully signed</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-yellow-400/20 cursor-pointer hover:border-gray-400/50 transition-colors" onClick={() => setStatusFilter("draft")} data-testid="card-stat-drafts">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Drafts</CardTitle>
                <FileText className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.draft || 0}</div>
                <p className="text-xs text-gray-500">Not yet sent</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-zinc-900 border-yellow-400/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Envelopes</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your signature requests and track their progress
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search envelopes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-500"
                  data-testid="input-search-envelopes"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-zinc-800 border-yellow-400/30 text-white" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-yellow-400/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()} className="bg-zinc-800 border-yellow-400/30 text-gray-300 hover:bg-zinc-700 hover:text-white" data-testid="button-refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {envelopesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg border-zinc-800 bg-zinc-800/50">
                  <Skeleton className="h-10 w-10 rounded bg-zinc-700" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 bg-zinc-700" />
                    <Skeleton className="h-3 w-32 bg-zinc-700" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-zinc-700" />
                </div>
              ))}
            </div>
          ) : filteredEnvelopes.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No envelopes found</h3>
              <p className="text-gray-400 mb-4">
                {statusFilter !== "all" 
                  ? `No envelopes with status "${statusFilter}"`
                  : "Get started by creating your first envelope"}
              </p>
              {statusFilter === "all" && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  data-testid="button-create-first-envelope"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Envelope
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-gray-400">Title</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Sender</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnvelopes.map((envelope) => (
                    <TableRow key={envelope.id} className="border-zinc-800 hover:bg-zinc-800/50" data-testid={`row-envelope-${envelope.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{envelope.title}</div>
                          {envelope.description && (
                            <div className="text-sm text-gray-400 truncate max-w-xs">{envelope.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(envelope.status)}</TableCell>
                      <TableCell className="text-gray-300">
                        {envelope.senderName || "—"}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {format(new Date(envelope.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-zinc-800" data-testid={`button-actions-${envelope.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                            <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-zinc-700" data-testid={`action-view-${envelope.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {envelope.status === "draft" && (
                              <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-zinc-700" data-testid={`action-send-${envelope.id}`}>
                                <Send className="h-4 w-4 mr-2" />
                                Send for Signing
                              </DropdownMenuItem>
                            )}
                            {envelope.status === "completed" && (
                              <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white focus:text-white focus:bg-zinc-700" data-testid={`action-download-${envelope.id}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Download Signed
                              </DropdownMenuItem>
                            )}
                            {(envelope.status === "draft" || envelope.status === "sent") && (
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-zinc-700"
                                onClick={() => handleVoidEnvelope(envelope)}
                                data-testid={`action-void-${envelope.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Void Envelope
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
