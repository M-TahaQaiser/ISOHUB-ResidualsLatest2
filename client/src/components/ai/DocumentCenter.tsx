import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Search,
  Eye,
  Download,
  Trash2,
  Check,
  X,
  Clock,
  File,
  FileSpreadsheet,
  FileImage,
  Loader2,
  Plus,
  Filter,
  RefreshCw
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  content: string;
  fileType?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  visibleToRole: string;
  viewCount: number;
  isActive: boolean;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: number;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
}

interface DocumentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byFileType: Record<string, number>;
}

interface SearchResult extends Document {
  relevanceScore: number;
  matchedContent?: string;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileText className="h-5 w-5" />;
  if (fileType.includes("spreadsheet") || fileType === "csv" || fileType === "xlsx") return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (fileType.includes("image") || fileType === "png" || fileType === "jpg" || fileType === "jpeg") return <FileImage className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20" data-testid="status-approved"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" data-testid="status-pending"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20" data-testid="status-rejected"><X className="h-3 w-3 mr-1" /> Rejected</Badge>;
    default:
      return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
  }
};

interface DocumentCenterProps {
  isAdmin?: boolean;
}

type VisibilityRole = "public" | "rep" | "admin";

export function DocumentCenter({ isAdmin = false }: DocumentCenterProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState<{ title: string; content: string; visibleToRole: VisibilityRole }>({ title: "", content: "", visibleToRole: "public" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewDocument, setViewDocument] = useState<Document | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [rejectReason, setRejectReason] = useState("");
  const [documentToReject, setDocumentToReject] = useState<Document | null>(null);

  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents", filterStatus],
    queryFn: () => apiRequest(`/api/documents${filterStatus !== "all" ? `?approvalStatus=${filterStatus}` : ""}`),
  });

  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ["/api/documents/stats"],
    queryFn: () => apiRequest("/api/documents/stats"),
  });

  const { data: pendingDocuments = [], isLoading: pendingLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents/pending"],
    queryFn: () => apiRequest("/api/documents/pending"),
    enabled: isAdmin,
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest("/api/documents/search", { 
        method: "POST", 
        body: { query, limit: 10 } 
      }) as SearchResult[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setShowUploadDialog(false);
      setUploadData({ title: "", content: "", visibleToRole: "public" });
      setSelectedFile(null);
      toast({ title: "Document uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; visibleToRole: string }) => {
      return await apiRequest("/api/documents", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setShowUploadDialog(false);
      setUploadData({ title: "", content: "", visibleToRole: "public" });
      toast({ title: "Document created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create document", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/documents/${id}/approve`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      toast({ title: "Document approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest(`/api/documents/${id}/reject`, { method: "POST", body: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setDocumentToReject(null);
      setRejectReason("");
      toast({ title: "Document rejected" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/documents/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      toast({ title: "Document deleted" });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadData.title || selectedFile.name);
      formData.append("visibleToRole", uploadData.visibleToRole);
      uploadMutation.mutate(formData);
    } else if (uploadData.title && uploadData.content) {
      createDocumentMutation.mutate(uploadData);
    }
  };

  const displayDocuments = searchMutation.data || documents;
  const isSearchMode = searchMutation.data && searchMutation.data.length > 0;

  return (
    <div className="flex flex-col h-full bg-background" data-testid="document-center">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-title">
              <FileText className="h-5 w-5 text-yellow-500" />
              Document Center
            </h2>
            <p className="text-sm text-muted-foreground">Upload and search documents for AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchDocuments()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black" data-testid="button-upload-new">
                  <Plus className="h-4 w-4 mr-1" /> New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>Add a new document to the knowledge base</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                      placeholder="Document title"
                      data-testid="input-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Upload File (or enter content below)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-yellow-500 transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            if (!uploadData.title) {
                              setUploadData({ ...uploadData, title: file.name });
                            }
                          }
                        }}
                        accept=".txt,.csv,.json,.md,.pdf,.docx,.xlsx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer" data-testid="label-file-upload">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            {getFileIcon(selectedFile.type)}
                            <span>{selectedFile.name}</span>
                            <span className="text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload a file</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {!selectedFile && (
                    <div className="space-y-2">
                      <Label htmlFor="content">Or paste content directly</Label>
                      <Textarea
                        id="content"
                        value={uploadData.content}
                        onChange={(e) => setUploadData({ ...uploadData, content: e.target.value })}
                        placeholder="Document content..."
                        className="min-h-[100px]"
                        data-testid="input-content"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={uploadData.visibleToRole}
                      onValueChange={(v) => setUploadData({ ...uploadData, visibleToRole: v as "public" | "rep" | "admin" })}
                    >
                      <SelectTrigger data-testid="select-visibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Everyone can see</SelectItem>
                        <SelectItem value="rep">Reps Only</SelectItem>
                        <SelectItem value="admin">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending || createDocumentMutation.isPending || (!selectedFile && (!uploadData.title || !uploadData.content))}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    data-testid="button-submit-upload"
                  >
                    {(uploadMutation.isPending || createDocumentMutation.isPending) ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-1" /> Upload</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <div className="text-lg font-bold" data-testid="text-total-count">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-500" data-testid="text-approved-count">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-500" data-testid="text-pending-count">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-500" data-testid="text-rejected-count">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search documents with AI..."
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={searchMutation.isPending || !searchQuery.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            data-testid="button-search"
          >
            {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32" data-testid="select-filter-status">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="documents" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          {isAdmin && <TabsTrigger value="approval" data-testid="tab-approval">Approval Queue ({pendingDocuments.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="documents" className="flex-1 mt-0 p-4">
          <ScrollArea className="h-[calc(100vh-380px)]">
            {documentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              </div>
            ) : displayDocuments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{isSearchMode ? "No documents found matching your search" : "No documents yet. Upload your first document!"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {displayDocuments.map((doc) => (
                  <Card key={doc.id} className="hover:border-yellow-500/50 transition-colors" data-testid={`card-document-${doc.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getFileIcon(doc.fileType)}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {doc.content.substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {getStatusBadge(doc.approvalStatus)}
                              <Badge variant="outline" className="text-xs" data-testid={`badge-role-${doc.id}`}>
                                {doc.visibleToRole === "public" ? "Public" : doc.visibleToRole === "rep" ? "Reps" : "Admin"}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {doc.viewCount} views
                              </span>
                              {doc.fileSizeBytes && (
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(doc.fileSizeBytes)}
                                </span>
                              )}
                              {'relevanceScore' in doc && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500">
                                  {((doc as SearchResult).relevanceScore * 100).toFixed(0)}% match
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewDocument(doc)}
                            data-testid={`button-view-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteMutation.mutate(doc.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="approval" className="flex-1 mt-0 p-4">
            <ScrollArea className="h-[calc(100vh-380px)]">
              {pendingLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                </div>
              ) : pendingDocuments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>All documents have been reviewed!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendingDocuments.map((doc) => (
                    <Card key={doc.id} className="border-yellow-500/30" data-testid={`card-pending-${doc.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getFileIcon(doc.fileType)}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{doc.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {doc.content.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {doc.visibleToRole === "public" ? "Public" : doc.visibleToRole === "rep" ? "Reps" : "Admin"}
                                </Badge>
                                {doc.fileSizeBytes && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.fileSizeBytes)}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setViewDocument(doc)}
                              data-testid={`button-view-pending-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => approveMutation.mutate(doc.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-500 hover:bg-green-600 text-white"
                              data-testid={`button-approve-${doc.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => setDocumentToReject(doc)}
                              data-testid={`button-reject-${doc.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon(viewDocument?.fileType)}
              {viewDocument?.title}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {viewDocument && getStatusBadge(viewDocument.approvalStatus)}
              <Badge variant="outline">
                {viewDocument?.visibleToRole === "public" ? "Public" : viewDocument?.visibleToRole === "rep" ? "Reps" : "Admin"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                <Eye className="h-3 w-3 inline mr-1" /> {viewDocument?.viewCount} views
              </span>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-mono">{viewDocument?.content}</pre>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDocument(null)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!documentToReject} onOpenChange={() => setDocumentToReject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{documentToReject?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="min-h-[100px]"
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentToReject(null)} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => documentToReject && rejectMutation.mutate({ id: documentToReject.id, reason: rejectReason })}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentCenter;
