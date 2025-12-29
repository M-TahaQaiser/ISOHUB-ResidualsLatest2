import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Search, 
  Send,
  FileText,
  Users,
  Settings,
  BarChart3,
  Upload,
  Mail,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function Help() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your ISO Hub assistant. I can help you with onboarding, user guides, troubleshooting, and any questions about the platform. What would you like to know?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create a new organization?',
          a: 'Navigate to Organization Management in the admin sidebar, click "Create Organization", fill out the required information, and the system will automatically send a welcome email with activation instructions.'
        },
        {
          q: 'What happens during the onboarding process?',
          a: 'The onboarding includes 7 steps: Instance Setup, Company Information, Organization Chart, Business Profile, Vendor Selection (36 vendors), Document Hub Integration, and Dashboard Tour.'
        },
        {
          q: 'How long does onboarding take?',
          a: 'The complete onboarding process typically takes 30-45 minutes, depending on your organization\'s complexity and vendor selections.'
        }
      ]
    },
    {
      category: 'User Management',
      questions: [
        {
          q: 'What user roles are available?',
          a: 'Available roles include SuperAdmin, Admin, Manager, Team Leaders, Users/Reps, Team Members, and Partners. Each role has specific permissions and access levels.'
        },
        {
          q: 'How do I reset a user\'s password?',
          a: 'In User Management, select the user and click "Reset Password". The system will generate a secure temporary password and send it via email.'
        },
        {
          q: 'Can I bulk assign roles to multiple users?',
          a: 'Yes, use the bulk assignment tools in the User Management section to efficiently assign roles and permissions to multiple users at once.'
        }
      ]
    },
    {
      category: 'Data & Reports',
      questions: [
        {
          q: 'Which processors are supported?',
          a: 'Currently supported processors include Payment Advisors, Clearent, Global Payments TSYS, Merchant Lynx, Micamp Solutions, First Data, and Shift4.'
        },
        {
          q: 'How do I upload processor data?',
          a: 'Go to Data Upload, select your processor and month, then upload the CSV or Excel file. The system validates and processes the data automatically.'
        },
        {
          q: 'Can I generate custom reports?',
          a: 'Yes, use the AI Report Builder to create custom reports using natural language queries. The system can generate agent reports, revenue summaries, and trend analysis.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          q: 'What file formats are supported for uploads?',
          a: 'The system supports CSV and Excel (.xlsx) files. Each processor has specific format requirements that are automatically validated.'
        },
        {
          q: 'Why is my activation link not working?',
          a: 'Activation links expire after 24 hours. If expired, request a new activation link from the Organization Management page.'
        },
        {
          q: 'How do I integrate with external document systems?',
          a: 'During onboarding Step 6, you can connect Google Drive, OneDrive, SharePoint, or Dropbox using OAuth authentication.'
        }
      ]
    }
  ];

  const userGuides = [
    {
      title: 'Complete Onboarding Guide',
      description: 'Step-by-step walkthrough of the 7-step onboarding process',
      icon: <Users className="h-5 w-5" />,
      file: 'ONBOARDING_USER_GUIDE.md',
      tags: ['Getting Started', 'Required']
    },
    {
      title: 'Data Upload & Processing',
      description: 'How to upload and manage processor data files',
      icon: <Upload className="h-5 w-5" />,
      file: 'data-upload-guide.md',
      tags: ['Data Management', 'Processors']
    },
    {
      title: 'User Management System',
      description: 'Managing users, roles, and permissions',
      icon: <Shield className="h-5 w-5" />,
      file: 'user-management-guide.md',
      tags: ['Administration', 'Security']
    },
    {
      title: 'AI Report Builder',
      description: 'Creating custom reports with natural language',
      icon: <BarChart3 className="h-5 w-5" />,
      file: 'ai-reports-guide.md',
      tags: ['Reports', 'AI Features']
    },
    {
      title: 'Email Integration Setup',
      description: 'Configuring SMTP and email templates',
      icon: <Mail className="h-5 w-5" />,
      file: 'email-integration-guide.md',
      tags: ['Configuration', 'Communication']
    },
    {
      title: 'Vendor Portal Management',
      description: 'Managing 36 vendors across 4 categories',
      icon: <Settings className="h-5 w-5" />,
      file: 'vendor-portal-guide.md',
      tags: ['Vendors', 'Integration']
    }
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          conversationHistory: chatMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      });

      const data = await response.json();
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I apologize, but I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I\'m having trouble connecting to the server. Please check your internet connection and try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('onboarding') || input.includes('setup')) {
      return 'The onboarding process includes 7 comprehensive steps: Instance Setup, Company Information, Organization Chart, Business Profile, Vendor Selection (choose from 36 vendors), Document Hub Integration, and Dashboard Tour. Each step typically takes 3-10 minutes. Would you like specific details about any particular step?';
    }

    if (input.includes('organization') || input.includes('create')) {
      return 'To create a new organization: 1) Navigate to "Organization Management" in the admin sidebar, 2) Click "Create Organization", 3) Fill out organization details including admin contact information, 4) The system automatically generates an activation link and sends a welcome email. The new admin can then activate their account and begin the 7-step onboarding process.';
    }

    if (input.includes('user') || input.includes('role') || input.includes('permission')) {
      return 'ISO Hub supports 7 user roles: SuperAdmin (full system access), Admin (organization management), Manager (team oversight), Team Leaders (team management), Users/Reps (daily operations), Team Members (basic access), and Partners (external access). Each role has specific permissions. You can manage users through the User Management section.';
    }

    if (input.includes('processor') || input.includes('data') || input.includes('upload')) {
      return 'Supported processors include Payment Advisors, Clearent, Global Payments TSYS, Merchant Lynx, Micamp Solutions, First Data, and Shift4. Upload data through the Data Upload section by selecting your processor and month, then uploading CSV or Excel files. The system automatically validates and processes the data.';
    }

    if (input.includes('report') || input.includes('ai') || input.includes('analytics')) {
      return 'The AI Report Builder allows you to create custom reports using natural language queries. You can generate agent reports, revenue summaries, processor comparisons, and trend analysis. Simply describe what you want to see, and the AI will create the appropriate report visualization.';
    }

    if (input.includes('email') || input.includes('notification') || input.includes('smtp')) {
      return 'Email integration includes professional templates for welcome emails, activation links, and report delivery. SMTP is configured with Gmail authentication. The system automatically sends welcome emails when organizations are created and provides professional communication templates.';
    }

    if (input.includes('vendor') || input.includes('integration')) {
      return 'The vendor portal includes 36 vendors across 4 categories: Processors (7), Gateways (11), Hardware/Equipment (12), and Internal tools (6). During onboarding, you can select relevant vendors for your organization. Each vendor includes contact information and integration details.';
    }

    if (input.includes('help') || input.includes('support') || input.includes('contact')) {
      return 'For additional support: 1) Check the User Guides section for detailed documentation, 2) Browse the FAQ for common questions, 3) Use this AI chat for quick answers, 4) Contact support at support@isohub.io for technical issues. Most questions can be resolved using the comprehensive documentation provided.';
    }

    return 'I can help you with onboarding, user management, data uploads, reporting, email configuration, and vendor integration. Could you please be more specific about what you\'d like to know? For example, you could ask about "how to create an organization" or "what processors are supported".';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Help & Support Center</h1>
          <p className="text-gray-400">Find answers, guides, and get help with ISO Hub platform</p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-yellow-400/20">
            <TabsTrigger value="chat" className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <MessageCircle className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <Book className="h-4 w-4" />
              User Guides
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2 text-gray-400 data-[state=active]:bg-yellow-400 data-[state=active]:text-black">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="bg-zinc-900/80 border border-yellow-400/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  AI Assistant Chat
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ask questions about onboarding, features, troubleshooting, or anything else about ISO Hub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-yellow-400/20 rounded-lg h-96 flex flex-col bg-zinc-900/50">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user' 
                              ? 'bg-yellow-400 text-black' 
                              : 'bg-zinc-800 text-gray-300'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-zinc-800 px-4 py-2 rounded-lg">
                            <p className="text-sm text-gray-400">AI is typing...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-yellow-400/10 p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about onboarding, features, or any questions..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-500"
                      />
                      <Button onClick={handleSendMessage} size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userGuides.map((guide, index) => (
                <Card key={index} className="bg-zinc-900/80 border border-yellow-400/20 hover:border-yellow-400/40 transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <span className="text-yellow-400">{guide.icon}</span>
                      {guide.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {guide.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Guide
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="space-y-6">
              {faqs.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="bg-zinc-900/80 border border-yellow-400/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.questions.map((faq, faqIndex) => (
                        <div key={faqIndex} className="border-b border-yellow-400/10 pb-4 last:border-b-0">
                          <h4 className="font-medium text-white mb-2 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {faq.q}
                          </h4>
                          <p className="text-gray-400 text-sm ml-6">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Help Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-14 w-14 shadow-lg bg-yellow-400 hover:bg-yellow-500 text-black">
                <MessageCircle className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border border-yellow-400/20">
              <DialogHeader>
                <DialogTitle className="text-white">Quick Help</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={() => {
                    setIsChatOpen(false);
                    window.location.hash = 'chat';
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open AI Chat Assistant
                </Button>
                <Button variant="outline" className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                  <Book className="h-4 w-4 mr-2" />
                  View User Guides
                </Button>
                <Button variant="outline" className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Browse FAQ
                </Button>
                <Button variant="outline" className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
