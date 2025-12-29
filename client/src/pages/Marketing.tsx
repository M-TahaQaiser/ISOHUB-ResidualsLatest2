import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Megaphone,
  Plus,
  FolderOpen,
  FileText,
  Image,
  Video,
  Download,
  Eye,
  Edit3,
  Trash2,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketingCategory {
  id: string;
  name: string;
  itemCount: number;
  description: string;
}

interface MarketingItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  fileType: 'pdf' | 'image' | 'video' | 'document';
  fileSize: number;
  downloadCount: number;
  createdDate: string;
  updatedDate: string;
  isComingSoon?: boolean;
}

export default function Marketing() {
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data based on screenshot showing Postcards, Business Cards, and Flyers categories
  const mockCategories: MarketingCategory[] = [
    {
      id: 'postcards',
      name: 'Postcards',
      itemCount: 2,
      description: 'Professional postcards for marketing campaigns and client outreach'
    },
    {
      id: 'business-cards',
      name: 'Business Cards',
      itemCount: 2,
      description: 'Professional business card templates and designs'
    },
    {
      id: 'flyers',
      name: 'Flyers',
      itemCount: 2,
      description: 'Marketing flyers and promotional materials'
    }
  ];

  const mockItems: MarketingItem[] = [
    // Postcards
    {
      id: '1',
      categoryId: 'postcards',
      name: 'Post card 1',
      description: 'Professional postcard design template',
      fileType: 'pdf',
      fileSize: 2048576, // 2MB
      downloadCount: 15,
      createdDate: '2024-07-15T00:00:00Z',
      updatedDate: '2024-07-15T00:00:00Z'
    },
    {
      id: '2',
      categoryId: 'postcards',
      name: 'Post card 2',
      description: 'Alternative postcard design template',
      fileType: 'pdf',
      fileSize: 1843200, // 1.8MB
      downloadCount: 8,
      createdDate: '2024-07-16T00:00:00Z',
      updatedDate: '2024-07-16T00:00:00Z'
    },
    // Business Cards
    {
      id: '3',
      categoryId: 'business-cards',
      name: 'Business Card 1',
      description: 'Professional business card template',
      fileType: 'pdf',
      fileSize: 1024000, // 1MB
      downloadCount: 25,
      createdDate: '2024-07-10T00:00:00Z',
      updatedDate: '2024-07-10T00:00:00Z'
    },
    {
      id: '4',
      categoryId: 'business-cards',
      name: 'Business Card 2',
      description: 'Alternative business card design',
      fileType: 'pdf',
      fileSize: 950000, // 950KB
      downloadCount: 12,
      createdDate: '2024-07-12T00:00:00Z',
      updatedDate: '2024-07-12T00:00:00Z',
      isComingSoon: true
    },
    // Flyers
    {
      id: '5',
      categoryId: 'flyers',
      name: 'Flyers 1',
      description: 'Marketing flyer template',
      fileType: 'pdf',
      fileSize: 3072000, // 3MB
      downloadCount: 7,
      createdDate: '2024-07-05T00:00:00Z',
      updatedDate: '2024-07-05T00:00:00Z'
    },
    {
      id: '6',
      categoryId: 'flyers',
      name: 'Flyers 2',
      description: 'Promotional flyer template',
      fileType: 'pdf',
      fileSize: 2560000, // 2.5MB
      downloadCount: 3,
      createdDate: '2024-07-08T00:00:00Z',
      updatedDate: '2024-07-08T00:00:00Z'
    }
  ];

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/marketing/categories'],
    queryFn: () => Promise.resolve(mockCategories),
    initialData: mockCategories
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/marketing/items', selectedCategory],
    queryFn: () => {
      if (!selectedCategory) return Promise.resolve([]);
      return Promise.resolve(mockItems.filter(item => item.categoryId === selectedCategory));
    },
    initialData: []
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => 
      fetch('/api/marketing/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: `Marketing materials for ${name}` }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/categories'] });
      setIsNewCategoryOpen(false);
      setNewCategoryName('');
      toast({
        title: "Category created",
        description: "New marketing category has been added successfully"
      });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a category name",
        variant: "destructive"
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('postcard')) return <FileText className="h-5 w-5 text-yellow-600" />;
    if (name.includes('business')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (name.includes('flyer')) return <FileText className="h-5 w-5 text-green-600" />;
    return <FolderOpen className="h-5 w-5 text-gray-600" />;
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading marketing materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 border-b border-yellow-400/20 px-4 py-3">
        <h1 className="text-xl font-semibold text-white">Marketing</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Megaphone className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">Marketing</h1>
                    <p className="text-black/80">Access and manage marketing materials and resources.</p>
                  </div>
                </div>
                <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-black hover:bg-gray-800 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          placeholder="e.g., Brochures, Banners, etc."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                        />
                      </div>
                      <Button 
                        onClick={handleCreateCategory}
                        disabled={createCategoryMutation.isPending}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900/80 border border-yellow-400/20">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedCategory === category.id
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-zinc-700 hover:border-yellow-400/50 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(category.name)}
                          <div>
                            <h3 className="font-medium text-white">{category.name}</h3>
                            <p className="text-sm text-gray-500">
                              {category.itemCount} items
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                          {category.itemCount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          <div className="lg:col-span-2">
            {!selectedCategory ? (
              <Card className="bg-zinc-900/80 border border-yellow-400/20">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Select a Category
                  </h3>
                  <p className="text-gray-500">
                    Choose a category from the left to view marketing materials
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900/80 border border-yellow-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                      {categories?.find(c => c.id === selectedCategory)?.name} Materials
                    </h2>
                    <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {itemsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading items...</p>
                    </div>
                  ) : items && items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <Card key={item.id} className="bg-zinc-800/50 border-yellow-400/20 relative">
                          <CardContent className="p-4">
                            {item.isComingSoon && (
                              <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-medium">
                                Coming Soon
                              </div>
                            )}
                            <div className="flex items-start space-x-3">
                              {getFileIcon(item.fileType)}
                              <div className="flex-1">
                                <h3 className="font-medium text-white mb-1">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{formatFileSize(item.fileSize)}</span>
                                  <div className="flex items-center space-x-1">
                                    <Download className="h-3 w-3" />
                                    <span>{item.downloadCount}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
                              <span className="text-xs text-gray-500">
                                Updated {new Date(item.updatedDate).toLocaleDateString()}
                              </span>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={item.isComingSoon}>
                                  <Eye className="h-4 w-4 text-yellow-400" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={item.isComingSoon}>
                                  <Download className="h-4 w-4 text-yellow-400" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Edit3 className="h-4 w-4 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        No items yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        This category doesn't have any marketing materials yet
                      </p>
                      <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}