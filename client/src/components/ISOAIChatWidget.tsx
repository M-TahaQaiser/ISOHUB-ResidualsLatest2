import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Brain,
  Send,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  MessageSquare,
  Loader2,
  Sparkles,
  Image,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Chat {
  id: number;
  title: string;
}

export default function ISOAIChatWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ type: string; data: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: chatData } = useQuery<{ chat: Chat; messages: Message[] }>({
    queryKey: ["/api/jacc/chats", currentChatId],
    queryFn: () => apiRequest(`/api/jacc/chats/${currentChatId}`),
    enabled: !!currentChatId && isOpen,
  });

  const messages = chatData?.messages || [];

  const createChatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/jacc/chats", { method: "POST", body: { title: "Quick Chat" } });
    },
    onSuccess: (data) => {
      setCurrentChatId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/jacc/chats"] });
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

    let chatId = currentChatId;

    if (!chatId) {
      const newChat = await createChatMutation.mutateAsync();
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
      const response = await fetch("/api/jacc/messages/stream-with-tools", {
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
      if (chatIdFromHeader && !currentChatId) {
        setCurrentChatId(parseInt(chatIdFromHeader));
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

  const startNewChat = () => {
    setCurrentChatId(null);
    setStreamingContent("");
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-yellow-500 hover:bg-yellow-400 shadow-lg z-50"
              data-testid="jacc-widget-button"
            >
              <Brain className="h-6 w-6 text-black" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-zinc-900 border-zinc-800">
            <p>Chat with ISO-AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col transition-all duration-200 ${
        isExpanded
          ? "bottom-4 right-4 w-[500px] h-[700px]"
          : "bottom-6 right-6 w-[380px] h-[500px]"
      }`}
      data-testid="jacc-widget-container"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-black rounded-t-lg">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold text-white">ISO-AI</span>
          <span className="text-xs text-zinc-400">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-zinc-800"
            onClick={startNewChat}
            data-testid="widget-new-chat"
          >
            <MessageSquare className="h-4 w-4 text-zinc-400" />
          </Button>
          <Link href="/iso-ai">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-zinc-800"
              data-testid="widget-expand-full"
            >
              <ExternalLink className="h-4 w-4 text-zinc-400" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-zinc-800"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="widget-toggle-size"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4 text-zinc-400" />
            ) : (
              <Maximize2 className="h-4 w-4 text-zinc-400" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-zinc-800"
            onClick={() => setIsOpen(false)}
            data-testid="widget-close"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <Brain className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">How can I help?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Ask me anything about merchant services, payment processing, or ISO Hub.
              </p>
              <div className="grid grid-cols-2 gap-2 text-left">
                {[
                  "Find a processor for my merchant",
                  "Explain interchange fees",
                  "Help with a chargeback",
                  "Create a proposal",
                ].map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-xs border-zinc-700 text-gray-300 hover:text-white hover:border-yellow-500/50 hover:bg-yellow-500/10 justify-start"
                    onClick={() => {
                      setInputMessage(prompt);
                    }}
                    data-testid={`quick-prompt-${prompt.slice(0, 10)}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-yellow-500 flex-shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-500 font-medium">ISO-AI</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isStreaming && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-zinc-800 text-white">
                  <div className="flex items-center gap-1 mb-1">
                    <Brain className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-medium">ISO-AI</span>
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-500 ml-1" />
                  </div>
                  <div className="whitespace-pre-wrap">{streamingContent}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={`data:${selectedImage.type};base64,${selectedImage.data}`}
              alt="Selected"
              className="h-16 rounded border border-zinc-700"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-zinc-800 rounded-full hover:bg-zinc-700"
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-zinc-800"
            onClick={() => fileInputRef.current?.click()}
            data-testid="widget-upload-image"
          >
            <Image className="h-4 w-4 text-zinc-400" />
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask ISO-AI..."
            className="flex-1 h-8 text-sm bg-zinc-800 border-zinc-700 focus:border-yellow-500"
            disabled={isStreaming}
            data-testid="widget-message-input"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isStreaming || (!inputMessage.trim() && !selectedImage)}
            className="h-8 w-8 p-0 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50"
            data-testid="widget-send-button"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <Send className="h-4 w-4 text-black" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
