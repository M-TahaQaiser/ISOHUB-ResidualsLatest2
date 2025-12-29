import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, Sparkles, AlertCircle, RefreshCw, MessageSquare, History } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  model?: string;
  tokens?: number;
  responseTime?: number;
}

interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  organizationId: string;
  userId?: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest('/api/ai/chat', {
        method: 'POST',
        body: {
          query,
          sessionId,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });
    },
    onMutate: async (query) => {
      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
    },
    onSuccess: (data) => {
      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        tokens: data.tokens,
        responseTime: data.responseTime,
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session ID
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Invalidate sessions query
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
      setInput(messages[messages.length - 1]?.content || '');
    },
  });

  // Get chat sessions
  const { data: sessions } = useQuery({
    queryKey: ['/api/ai/sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/sessions', {
        method: 'GET',
      });
      return response.sessions as ChatSession[];
    },
  });

  // Check AI status
  const { data: aiStatus } = useQuery({
    queryKey: ['/api/ai/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/status', {
        method: 'GET',
      });
      return response;
    },
    refetchInterval: 60000, // Check every minute
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages || []);
    setSessionId(session.sessionId);
    setShowHistory(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Sparkles className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">ISO-AI Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {aiStatus?.status === 'operational' ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Offline
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            disabled={!sessions || sessions.length === 0}
            data-testid="button-chat-history"
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            disabled={messages.length === 0}
            data-testid="button-new-chat"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
              <Bot className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              Welcome to ISO-AI Assistant
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Ask me anything about merchant services, residuals, commission structures, or get help with your ISO business.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setInput('What are typical commission rates for credit card processing?')}
                data-testid="button-sample-question-1"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                Commission rates
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setInput('How do I calculate residuals?')}
                data-testid="button-sample-question-2"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                Calculate residuals
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setInput('What is interchange pricing?')}
                data-testid="button-sample-question-3"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                Interchange pricing
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setInput('How do chargebacks work?')}
                data-testid="button-sample-question-4"
              >
                <Sparkles className="w-4 h-4 mr-2 text-yellow-600" />
                Chargeback process
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
                data-testid={`message-${message.role}-${index}`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback
                    className={
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-yellow-500 text-black'
                    }
                  >
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <Card
                    className={`inline-block max-w-[80%] p-3 ${
                      message.role === 'user'
                        ? 'bg-black text-white'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.model && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                        <Badge variant="secondary" className="text-xs">
                          {message.model}
                        </Badge>
                        {message.tokens && (
                          <span className="text-xs text-gray-400">
                            {message.tokens} tokens
                          </span>
                        )}
                        {message.responseTime && (
                          <span className="text-xs text-gray-400">
                            {(message.responseTime / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                  {message.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-yellow-500 text-black">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="p-3 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about merchant services..."
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={sendMessage.isPending}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            data-testid="button-send-message"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {aiStatus?.status !== 'operational' && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">
              AI services are currently unavailable
            </span>
          </div>
        )}
      </form>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              Select a previous conversation to continue
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session: any, index: number) => (
                  <Card
                    key={session.id || index}
                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => loadSession(session)}
                    data-testid={`chat-history-item-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {session.messages?.[0]?.content || 'New conversation'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.messages?.length || 0} messages
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(session.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No chat history available
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}