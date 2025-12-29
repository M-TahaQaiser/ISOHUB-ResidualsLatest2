import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { DocumentCenter } from "@/components/ai/DocumentCenter";
import {
  MessageSquare,
  Send,
  Plus,
  Folder,
  FolderPlus,
  Trash2,
  Edit3,
  Image,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Sparkles,
  FileText,
  Target,
  Megaphone,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  X,
  Loader2,
  Brain,
  Menu,
  Library
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Chat {
  id: number;
  title: string;
  folderId: number | null;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sourceType?: string;
}

interface ChatFolder {
  id: number;
  name: string;
  position: number;
}

interface Flow {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface FlowStep {
  key: string;
  question: string;
  options?: string[];
  type: "text" | "select" | "multiselect" | "number";
  hint?: string;
}

export default function ISOAI() {
  const { toast } = useToast();
  const { isAdmin } = useRoleAccess();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFlows, setShowFlows] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 768);
    }
  }, []);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep | null>(null);
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ type: string; data: string } | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showDocumentCenter, setShowDocumentCenter] = useState(false);
  const [useToolsMode, setUseToolsMode] = useState(true);
  const [lastToolCalls, setLastToolCalls] = useState<any[]>([]);
  const [responseConfidence, setResponseConfidence] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: chats = [], isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ["/api/jacc/chats"],
    queryFn: () => apiRequest("/api/jacc/chats"),
  });

  const { data: folders = [] } = useQuery<ChatFolder[]>({
    queryKey: ["/api/jacc/folders"],
    queryFn: () => apiRequest("/api/jacc/folders"),
  });

  const { data: flows = [] } = useQuery<Flow[]>({
    queryKey: ["/api/jacc/flows"],
    queryFn: () => apiRequest("/api/jacc/flows"),
  });

  const { data: chatData } = useQuery<{ chat: Chat; messages: Message[] }>({
    queryKey: ["/api/jacc/chats", selectedChatId],
    queryFn: () => apiRequest(`/api/jacc/chats/${selectedChatId}`),
    enabled: !!selectedChatId,
  });

  const messages = chatData?.messages || [];

  const createChatMutation = useMutation({
    mutationFn: async (title?: string) => {
      return await apiRequest("/api/jacc/chats", { method: "POST", body: { title } });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats"] });
      setSelectedChatId(data.id);
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: number) => {
      await apiRequest(`/api/jacc/chats/${chatId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats"] });
      if (selectedChatId === deleteChatMutation.variables) {
        setSelectedChatId(null);
      }
      toast({ title: "Chat deleted" });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("/api/jacc/folders", { method: "POST", body: { name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jacc/folders"] });
      setNewFolderName("");
      setShowNewFolderDialog(false);
      toast({ title: "Folder created" });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ messageId, rating, comment }: { messageId: number; rating: string; comment?: string }) => {
      await apiRequest(`/api/jacc/messages/${messageId}/feedback`, { method: "POST", body: { rating, comment } });
    },
    onSuccess: () => {
      toast({ title: "Thank you for your feedback!" });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    let chatId = selectedChatId;

    if (!chatId) {
      const newChat = await createChatMutation.mutateAsync("New Chat");
      chatId = newChat.id;
    }

    const messageToSend = inputMessage;
    const imageToSend = selectedImage;
    setInputMessage("");
    setSelectedImage(null);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const token = localStorage.getItem("authToken");
      const endpoint = useToolsMode ? "/api/jacc/messages/stream-with-tools" : "/api/jacc/messages/stream";
      setLastToolCalls([]);
      setResponseConfidence(null);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          chatId,
          message: messageToSend,
          images: imageToSend ? [imageToSend] : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to send message" }));
        throw new Error(errorData.error || "Failed to send message");
      }

      const chatIdFromHeader = response.headers.get("X-Chat-Id");
      if (chatIdFromHeader && !selectedChatId) {
        setSelectedChatId(parseInt(chatIdFromHeader));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.text) {
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              } else if (parsed.type === "message_stop") {
                if (parsed.toolCalls) {
                  setLastToolCalls(parsed.toolCalls);
                }
                if (parsed.confidence !== undefined) {
                  setResponseConfidence(parsed.confidence);
                }
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats", chatId] });
      queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats"] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSelectedImage({
        type: file.type,
        data: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Input Unavailable",
        description: "Your browser doesn't support voice recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, toast]);

  const copyToClipboard = (text: string, messageId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleDocumentCenter = useCallback((show: boolean) => {
    if (show) {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      if (isStreaming) {
        setIsStreaming(false);
        setStreamingContent("");
      }
      setSelectedImage(null);
    }
    setShowDocumentCenter(show);
  }, [isListening, isStreaming]);

  const startFlow = async (flowId: string) => {
    let chatId = selectedChatId;
    
    if (!chatId) {
      const newChat = await createChatMutation.mutateAsync("Guided Workflow");
      chatId = newChat.id;
    }

    try {
      const data = await apiRequest(`/api/jacc/flows/${flowId}/start`, { method: "POST", body: { chatId } });
      
      setActiveFlow(flowId);
      setFlowStep(data.currentStep);
      setFlowAnswers({});
      setShowFlows(false);
      
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start workflow",
        variant: "destructive",
      });
    }
  };

  const handleFlowAnswer = async (answer: string) => {
    if (!activeFlow || !selectedChatId) return;

    try {
      const data = await apiRequest(`/api/jacc/flows/${activeFlow}/answer`, {
        method: "POST",
        body: { chatId: selectedChatId, answer }
      });

      if (data.isComplete) {
        setActiveFlow(null);
        setFlowStep(null);
        setFlowAnswers({});
        
        queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats", selectedChatId] });
        
        toast({ title: "Workflow completed!" });
      } else {
        setFlowStep(data.nextStep);
        setFlowAnswers(prev => ({ ...prev, [data.nextStep?.key || ""]: "" }));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process answer",
        variant: "destructive",
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
        data-testid={`message-${message.id}`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser
              ? "bg-yellow-500 text-black"
              : "bg-zinc-800 text-white border border-zinc-700"
          }`}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-yellow-500 font-semibold">ISO-AI</span>
              {message.sourceType && (
                <Badge variant="outline" className="text-xs border-zinc-600">
                  {message.sourceType}
                </Badge>
              )}
            </div>
          )}
          <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          {!isUser && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-700">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-zinc-700"
                      onClick={() => feedbackMutation.mutate({ messageId: message.id, rating: "helpful" })}
                      data-testid={`feedback-helpful-${message.id}`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Helpful</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-zinc-700"
                      onClick={() => feedbackMutation.mutate({ messageId: message.id, rating: "not_helpful" })}
                      data-testid={`feedback-not-helpful-${message.id}`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Not helpful</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-zinc-700"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      data-testid={`copy-message-${message.id}`}
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    );
  };

  const flowIcons: Record<string, any> = {
    find_processor: Target,
    general_merchant: HelpCircle,
    create_proposal: FileText,
    rep_marketing: Megaphone,
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden" data-testid="isoai-page">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Fixed on mobile, relative on desktop */}
      <div
        className={`${
          sidebarOpen 
            ? "translate-x-0 w-80" 
            : "-translate-x-full md:translate-x-0 md:w-0 md:border-0"
        } fixed md:relative z-50 md:z-auto h-full transition-all duration-300 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden`}
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-yellow-500" />
              <span className="font-bold text-lg">ISO-AI</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-zinc-800"
              onClick={() => createChatMutation.mutate(undefined)}
              data-testid="new-chat-button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-400">
            Your AI Assistant for ISO Hub
          </p>
        </div>

        {/* Flows Section */}
        <div className="p-4 border-b border-zinc-800">
          <Button
            variant="outline"
            className="w-full justify-start border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500"
            onClick={() => setShowFlows(!showFlows)}
            data-testid="toggle-flows-button"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Guided Workflows
          </Button>
          {showFlows && (
            <div className="mt-3 space-y-2">
              {flows.map((flow) => {
                const IconComponent = flowIcons[flow.id] || Sparkles;
                return (
                  <Button
                    key={flow.id}
                    variant="ghost"
                    className="w-full justify-start text-sm hover:bg-zinc-800"
                    onClick={() => startFlow(flow.id)}
                    data-testid={`flow-${flow.id}`}
                  >
                    <IconComponent className="h-4 w-4 mr-2 text-yellow-500" />
                    {flow.name}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Document Center */}
        <div className="p-4 border-b border-zinc-800">
          <Button
            variant={showDocumentCenter ? "default" : "outline"}
            className={`w-full justify-start ${showDocumentCenter ? "bg-yellow-500 text-black hover:bg-yellow-400" : "border-zinc-700 hover:bg-zinc-800"}`}
            onClick={() => handleToggleDocumentCenter(!showDocumentCenter)}
            data-testid="toggle-document-center-button"
          >
            <Library className="h-4 w-4 mr-2" />
            Document Center
          </Button>
        </div>

        {/* Folders */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Folders</span>
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-zinc-800">
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="bg-zinc-800 border-zinc-700"
                  data-testid="new-folder-input"
                />
                <DialogFooter>
                  <Button
                    onClick={() => createFolderMutation.mutate(newFolderName)}
                    disabled={!newFolderName.trim()}
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                    data-testid="create-folder-button"
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-800 cursor-pointer text-sm"
              >
                <Folder className="h-4 w-4 text-yellow-500" />
                {folder.name}
              </div>
            ))}
          </div>
        </div>

        {/* Chats */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {chatsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No conversations yet
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                    selectedChatId === chat.id
                      ? "bg-yellow-500/20 border border-yellow-500/30"
                      : "hover:bg-zinc-800"
                  }`}
                  onClick={() => setSelectedChatId(chat.id)}
                  data-testid={`chat-item-${chat.id}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm truncate">{chat.title || "New Chat"}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                      <DropdownMenuItem
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatMutation.mutate(chat.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Toggle Sidebar Button - Desktop only */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-zinc-900 border border-zinc-800 rounded-l-none hover:bg-zinc-800"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ left: sidebarOpen ? "20rem" : "0" }}
        data-testid="toggle-sidebar-button"
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      
      {/* Mobile Floating Sidebar Toggle - Always visible when sidebar is closed */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden fixed left-3 bottom-28 z-[60] h-12 w-12 rounded-full bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 active:scale-95"
          onClick={() => setSidebarOpen(true)}
          data-testid="mobile-floating-menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* Document Center View */}
      {showDocumentCenter ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div 
            className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden hover:bg-zinc-800 -ml-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="mobile-menu-toggle-docs"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Library className="h-5 w-5 text-yellow-500" />
              <h1 className="font-semibold text-sm md:text-base truncate">
                Document Center
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleDocumentCenter(false)}
              className="hover:bg-zinc-800"
              data-testid="button-back-to-chat"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <DocumentCenter isAdmin={isAdmin()} />
          </div>
        </div>
      ) : (
      /* Main Chat Area */
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Enhanced for mobile */}
        <div 
          className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-zinc-800 -ml-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Brain className="h-5 w-5 text-yellow-500" />
            <h1 className="font-semibold text-sm md:text-base truncate">
              {chatData?.chat?.title || "ISO-AI"}
            </h1>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-zinc-800"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    data-testid="toggle-voice-button"
                  >
                    {voiceEnabled ? (
                      <Volume2 className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {voiceEnabled ? "Disable voice" : "Enable voice"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-zinc-800">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          {!selectedChatId && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg px-4">
                <Brain className="h-12 w-12 md:h-16 md:w-16 text-yellow-500 mx-auto mb-4 md:mb-6" />
                <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Welcome to ISO-AI</h2>
                <p className="text-zinc-400 text-sm md:text-base mb-6 md:mb-8">
                  Your AI Assistant for payment processing, proposals, and more.
                </p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {flows.slice(0, 4).map((flow) => {
                    const IconComponent = flowIcons[flow.id] || Sparkles;
                    return (
                      <Card
                        key={flow.id}
                        className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 active:scale-98 cursor-pointer transition-all"
                        onClick={() => startFlow(flow.id)}
                        data-testid={`welcome-flow-${flow.id}`}
                      >
                        <CardContent className="p-3 md:p-4">
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 mb-2" />
                          <h3 className="font-semibold text-xs md:text-sm">{flow.name}</h3>
                          <p className="text-[10px] md:text-xs text-zinc-400 mt-1 hidden sm:block">{flow.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map(renderMessage)}
              {isStreaming && streamingContent && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-zinc-800 text-white border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-yellow-500 font-semibold">ISO-AI</span>
                      <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
                    </div>
                    <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">
                      {streamingContent}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Flow Step UI */}
        {activeFlow && flowStep && (
          <div className="border-t border-zinc-800 p-4 bg-zinc-900">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-semibold">Guided Workflow</span>
              </div>
              <p className="text-sm mb-3">{flowStep.question}</p>
              {flowStep.hint && (
                <p className="text-xs text-zinc-400 mb-3">{flowStep.hint}</p>
              )}
              {flowStep.options ? (
                <div className="flex flex-wrap gap-2">
                  {flowStep.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 hover:border-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => handleFlowAnswer(option)}
                      data-testid={`flow-option-${option}`}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={flowAnswers[flowStep.key] || ""}
                    onChange={(e) =>
                      setFlowAnswers((prev) => ({ ...prev, [flowStep.key]: e.target.value }))
                    }
                    placeholder="Type your answer..."
                    className="bg-zinc-800 border-zinc-700"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleFlowAnswer(flowAnswers[flowStep.key] || "");
                      }
                    }}
                    data-testid="flow-text-input"
                  />
                  <Button
                    onClick={() => handleFlowAnswer(flowAnswers[flowStep.key] || "")}
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                    data-testid="flow-submit-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-zinc-400 hover:text-white"
                onClick={() => {
                  setActiveFlow(null);
                  setFlowStep(null);
                }}
                data-testid="cancel-flow-button"
              >
                Cancel workflow
              </Button>
            </div>
          </div>
        )}

        {/* Input Area - Mobile Optimized */}
        {!activeFlow && (
          <div 
            className="border-t border-zinc-800 p-3 md:p-4 bg-zinc-900/95 backdrop-blur-lg"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
          >
            <div className="max-w-3xl mx-auto">
              {selectedImage && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={`data:${selectedImage.type};base64,${selectedImage.data}`}
                    alt="Selected"
                    className="h-16 md:h-20 rounded-lg border border-zinc-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-zinc-800 rounded-full hover:bg-zinc-700"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                
                {/* Image upload - hidden on very small screens */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex hover:bg-zinc-800 h-10 w-10"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="upload-image-button"
                      >
                        <Image className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Voice Input - More prominent on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-10 w-10 rounded-full transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
                      : 'hover:bg-zinc-800 active:scale-95'
                  }`}
                  onClick={toggleVoiceInput}
                  disabled={isStreaming}
                  data-testid="voice-input-button"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask anything..."}
                  className="flex-1 bg-zinc-800 border-zinc-700 focus:border-yellow-500 h-10 text-base"
                  disabled={isStreaming || isListening}
                  data-testid="message-input"
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={isStreaming || (!inputMessage.trim() && !selectedImage)}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 h-10 w-10 md:w-auto md:px-4 active:scale-95 transition-transform"
                  data-testid="send-message-button"
                >
                  {isStreaming ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="hidden md:block text-xs text-zinc-500 mt-2 text-center">
                ISO-AI uses Claude AI to provide expert merchant services guidance. Press Enter to send.
              </p>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
