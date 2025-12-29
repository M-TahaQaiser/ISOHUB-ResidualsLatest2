import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Send, 
  Calendar, 
  FileText, 
  Mail, 
  User,
  Clock,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecureDocument {
  id: string;
  filename: string;
  originalName: string;
  senderName: string;
  senderEmail: string;
  uploadDate: string;
  expirationDate: string;
  daysUntilExpiration: number;
  downloadCount: number;
  maxDownloads?: number;
  isExpired: boolean;
  fileSize: number;
  fileType: string;
}

interface UploadLinkRequest {
  recipientEmail: string;
  recipientName: string;
  message?: string;
  expirationDays: number;
  maxDownloads?: number;
}

export default function SecuredDocs() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadLinkData, setUploadLinkData] = useState<UploadLinkRequest>({
    recipientEmail: '',
    recipientName: '',
    message: '',
    expirationDays: 30,
    maxDownloads: 5
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data based on screenshot
  const mockDocuments: SecureDocument[] = [
    {
      id: '1',
      filename: 'pre-application-design-62.pdf',
      originalName: 'pre-application-design-62 (1).pdf',
      senderName: 'Ashton Vandy',
      senderEmail: 'ashton@adv.venologic@gmail.com',
      uploadDate: '2024-07-18T00:00:00Z',
      expirationDate: '2025-01-02T00:00:00Z',
      daysUntilExpiration: 167,
      downloadCount: 0,
      maxDownloads: 5,
      isExpired: false,
      fileSize: 2048576, // 2MB
      fileType: 'pdf'
    },
    {
      id: '2',
      filename: 'pre-application-design-57.pdf',
      originalName: 'pre-application-design-57 (1).pdf',
      senderName: 'Ashton Vandy',
      senderEmail: 'ashton@adv.venologic@gmail.com',
      uploadDate: '2024-07-19T00:00:00Z',
      expirationDate: '2025-01-01T00:00:00Z',
      daysUntilExpiration: 135,
      downloadCount: 1,
      maxDownloads: 5,
      isExpired: false,
      fileSize: 1536000, // 1.5MB
      fileType: 'pdf'
    },
    {
      id: '3',
      filename: 'principal.pdf',
      originalName: 'principal.pdf',
      senderName: 'Ashton Vandy',
      senderEmail: 'ashton@adv.venologic@gmail.com',
      uploadDate: '2024-07-20T00:00:00Z',
      expirationDate: '2024-12-31T00:00:00Z',
      daysUntilExpiration: 134,
      downloadCount: 2,
      maxDownloads: 10,
      isExpired: false,
      fileSize: 896000, // 896KB
      fileType: 'pdf'
    },
    {
      id: '4',
      filename: '1.jpg',
      originalName: '1.jpg',
      senderName: 'Test',
      senderEmail: 'test@example.com',
      uploadDate: '2024-07-15T00:00:00Z',
      expirationDate: '2024-12-30T00:00:00Z',
      daysUntilExpiration: 128,
      downloadCount: 0,
      maxDownloads: 3,
      isExpired: false,
      fileSize: 1024000, // 1MB
      fileType: 'jpg'
    },
    {
      id: '5',
      filename: 'principal-2.pdf',
      originalName: 'principal (1).pdf',
      senderName: 'Test',
      senderEmail: 'test@example.com',
      uploadDate: '2024-07-14T00:00:00Z',
      expirationDate: '2024-12-29T00:00:00Z',
      daysUntilExpiration: 128,
      downloadCount: 5,
      maxDownloads: 10,
      isExpired: false,
      fileSize: 2048000, // 2MB
      fileType: 'pdf'
    }
  ];

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/secured-docs'],
    queryFn: () => Promise.resolve(mockDocuments),
    initialData: mockDocuments
  });

  const sendUploadLinkMutation = useMutation({
    mutationFn: (linkData: UploadLinkRequest) => 
      fetch('/api/secured-docs/send-upload-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secured-docs'] });
      setIsUploadDialogOpen(false);
      setUploadLinkData({
        recipientEmail: '',
        recipientName: '',
        message: '',
        expirationDays: 30,
        maxDownloads: 5
      });
      toast({
        title: "Upload link sent",
        description: "Secure upload link has been sent successfully"
      });
    },
  });

  const handleSendUploadLink = () => {
    if (!uploadLinkData.recipientEmail || !uploadLinkData.recipientName) {
      toast({
        title: "Missing information",
        description: "Please provide recipient email and name",
        variant: "destructive"
      });
      return;
    }
    sendUploadLinkMutation.mutate(uploadLinkData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(fileType)) return <FileText className="h-5 w-5 text-blue-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 border-b border-yellow-400/20 px-4 py-3">
        <h1 className="text-xl font-semibold text-white">Secured Doc Portal</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Secured Doc Portal", href: "/secured-docs", isActive: true }
          ]} 
        />

        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Upload className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">Secured Doc Portal</h1>
                    <p className="text-black/80">Secure document sharing and management.</p>
                  </div>
                </div>
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-black hover:bg-gray-800 text-white">
                      <Send className="h-4 w-4 mr-2" />
                      Send Upload Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Send Secure Upload Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipientEmail">Recipient Email</Label>
                        <Input
                          id="recipientEmail"
                          type="email"
                          placeholder="recipient@example.com"
                          value={uploadLinkData.recipientEmail}
                          onChange={(e) => setUploadLinkData({...uploadLinkData, recipientEmail: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipientName">Recipient Name</Label>
                        <Input
                          id="recipientName"
                          placeholder="John Doe"
                          value={uploadLinkData.recipientName}
                          onChange={(e) => setUploadLinkData({...uploadLinkData, recipientName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Custom Message (Optional)</Label>
                        <Input
                          id="message"
                          placeholder="Please upload your documents using this secure link"
                          value={uploadLinkData.message}
                          onChange={(e) => setUploadLinkData({...uploadLinkData, message: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expirationDays">Expires in (days)</Label>
                          <Input
                            id="expirationDays"
                            type="number"
                            min="1"
                            max="365"
                            value={uploadLinkData.expirationDays}
                            onChange={(e) => setUploadLinkData({...uploadLinkData, expirationDays: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxDownloads">Max Downloads</Label>
                          <Input
                            id="maxDownloads"
                            type="number"
                            min="1"
                            max="100"
                            value={uploadLinkData.maxDownloads}
                            onChange={(e) => setUploadLinkData({...uploadLinkData, maxDownloads: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleSendUploadLink}
                        disabled={sendUploadLinkMutation.isPending}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        {sendUploadLinkMutation.isPending ? "Sending..." : "Send Upload Link"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="mb-8">
          <Card className="bg-zinc-900/80 border border-yellow-400/20">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6">
                Uploaded Documents
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-400/20">
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Document
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Sender
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Upload Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Expiration
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Downloads
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents?.map((doc) => (
                      <tr key={doc.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(doc.fileType)}
                            <div>
                              <p className="font-medium text-white">{doc.filename}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white">{doc.senderName}</p>
                            <p className="text-sm text-gray-500">{doc.senderEmail}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              doc.daysUntilExpiration < 30 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : 'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Expires in {doc.daysUntilExpiration} days
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-white">
                          {doc.downloadCount}/{doc.maxDownloads || '∞'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {documents?.map((doc) => (
                  <Card key={doc.id} className="bg-zinc-800/50 border-yellow-400/20">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        {getFileIcon(doc.fileType)}
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{doc.filename}</h3>
                          <p className="text-sm text-gray-500">{formatFileSize(doc.fileSize)}</p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${
                            doc.daysUntilExpiration < 30 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                          } text-xs`}
                        >
                          {doc.daysUntilExpiration}d
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-white">{doc.senderName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-white">{doc.senderEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-white">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Downloads: {doc.downloadCount}/{doc.maxDownloads || '∞'}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4 text-yellow-400" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4 text-yellow-400" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}