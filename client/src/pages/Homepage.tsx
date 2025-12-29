import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Shield,
  Brain,
  FileSearch,
  TrendingUp,
  Mic,
  ChevronRight,
  Terminal,
  Cpu,
  Database,
  Lock,
  MessageCircle,
  User,
  Bot
} from "lucide-react";

// Animated typing effect component
function TypeWriter({ text, speed = 50, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  return <span>{displayText}{!isComplete && <span className="animate-pulse">|</span>}</span>;
}

// Mock conversation data for the animated terminal
const mockConversation = [
  {
    type: "system" as const,
    label: "PROCESSING",
    content: "Importing March 2024 processor file..."
  },
  {
    type: "ai" as const,
    content: "✓ File validated. Found 847 merchant records across 3 processors."
  },
  {
    type: "ai" as const,
    content: "Running MID matching algorithm..."
  },
  {
    type: "system" as const,
    label: "MATCH COMPLETE",
    content: "847/847 MIDs matched • 23 reps identified • $127,432 in residuals"
  },
  {
    type: "ai" as const,
    content: "Commission splits calculated. All 23 rep statements generated and ready for portal."
  },
  {
    type: "user" as const,
    content: "Show me John's commission breakdown"
  },
  {
    type: "ai" as const,
    content: "John Mitchell: 47 MIDs • $4,832.50 commission • +12% vs last month. Top performer: MID 4521 ($847)."
  }
];

// Animated conversation component for the terminal
function AnimatedTerminalConversation() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= mockConversation.length) return;

    // Start showing the next message after a delay
    const showDelay = setTimeout(() => {
      setVisibleMessages(prev => [...prev, currentStep]);
      setTypingIndex(currentStep);
    }, currentStep === 0 ? 800 : 600);

    return () => clearTimeout(showDelay);
  }, [currentStep]);

  const handleMessageComplete = () => {
    setTypingIndex(null);
    // Move to next step after a brief pause
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 400);
  };

  return (
    <div className="space-y-3 transition-all duration-500">
      {mockConversation.map((msg, index) => {
        if (!visibleMessages.includes(index)) return null;
        const isTyping = typingIndex === index;

        if (msg.type === "system") {
          return (
            <div 
              key={index} 
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="text-xs text-gray-500 mb-1 font-mono">
                <span className="text-yellow-400">{msg.label}:</span>
              </div>
              <div className="p-3 bg-[#1a1a24] rounded border border-yellow-400/10 text-gray-300 text-sm">
                {isTyping ? (
                  <TypeWriter text={msg.content} speed={20} onComplete={handleMessageComplete} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        }

        if (msg.type === "user") {
          return (
            <div 
              key={index} 
              className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-blue-400" />
              </div>
              <div className="p-3 bg-blue-500/10 rounded border border-blue-400/20 text-gray-200 text-sm flex-1">
                {isTyping ? (
                  <TypeWriter text={msg.content} speed={30} onComplete={handleMessageComplete} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        }

        // AI message
        return (
          <div 
            key={index} 
            className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="w-6 h-6 rounded bg-yellow-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-yellow-400" />
            </div>
            <div className="p-3 bg-[#1a1a24] rounded border border-yellow-400/10 text-gray-300 text-sm flex-1">
              {isTyping ? (
                <TypeWriter text={msg.content} speed={15} onComplete={handleMessageComplete} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        );
      })}

      {/* Processing indicator when waiting for next message */}
      {currentStep < mockConversation.length && typingIndex === null && (
        <div className="flex items-center gap-2 text-gray-500 text-xs font-mono animate-pulse">
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}

// Corner bracket decoration component
function CornerBrackets({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Top left corner */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-400/60" />
      {/* Top right corner */}
      <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-400/60" />
      {/* Bottom left corner */}
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-400/60" />
      {/* Bottom right corner */}
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-400/60" />
      {children}
    </div>
  );
}

// Glowing orb background animation
function GlowingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-400/3 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-500" />
    </div>
  );
}

export default function Homepage() {
  const [neuralSync, setNeuralSync] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralSync(prev => (prev >= 98 ? 98 : prev + 1));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated background */}
      <GlowingOrbs />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-yellow-400/10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/isohub-logo.png"
                alt="ISOHub"
                className="h-28 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#ai-agent" className="text-gray-400 hover:text-white transition-colors">AI Agent</a>
              <a href="#security" className="text-gray-400 hover:text-white transition-colors">Security</a>
              <a href="#demo" className="text-gray-400 hover:text-white transition-colors">Demo</a>
              <Link href="/login">
                <Button variant="outline" className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                  <ChevronRight className="w-4 h-4 mr-1" />
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-12 md:py-20">
          <div className="grid xl:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            {/* Left side - Main content */}
            <div className="relative z-10">
              {/* Status indicator */}
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 font-mono text-sm tracking-wider">BUILT FOR MERCHANT SERVICES ISOs</span>
              </div>

              {/* Main headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6">
                <span className="text-white">STOP DROWNING</span><br />
                <span className="text-white">IN </span>
                <span className="text-yellow-400">SPREADSHEETS.</span>
              </h1>

              {/* Subheadline with accent bar */}
              <div className="flex gap-4 mb-8">
                <div className="w-1 bg-yellow-400" />
                <div>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Still calculating residuals manually in Excel? Still fielding "Where's my check?" calls all day?
                  </p>
                  <p className="text-lg text-gray-400 mt-2">
                    <span className="text-white font-semibold">ISOHUB</span> is your command center connecting your CRM data, processor residuals,
                    rep portals, and AI-powered analytics into <span className="text-yellow-400">one unified platform</span>.
                    Give your reps self-service access. Get your time back.
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-6 text-lg group"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    ACCESS PORTAL
                  </Button>
                </Link>
                <a href="#demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-600 text-white hover:bg-white/5 px-8 py-6 text-lg"
                  >
                    See It In Action
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 sm:gap-8 lg:gap-12">
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">20+</div>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono uppercase tracking-wider">Hours Saved/Month</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">0</div>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono uppercase tracking-wider">Rep Check Calls</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">1</div>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono uppercase tracking-wider">Central Hub</div>
                </div>
              </div>
            </div>

            {/* Right side - AI Terminal Display */}
            <div className="relative hidden xl:block">
              <CornerBrackets className="p-1">
                <div className="bg-[#0d0d12] border border-yellow-400/20 rounded-lg overflow-hidden min-w-[420px]">
                  {/* Terminal header */}
                  <div className="border-b border-yellow-400/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-500 font-mono text-xs">ISO-AI LIVE SESSION</span>
                    </div>
                  </div>

                  {/* Session info */}
                  <div className="border-b border-yellow-400/10 px-4 py-2 flex items-center justify-between bg-[#0a0a0f]">
                    <div className="text-xs text-gray-500 font-mono">
                      <span className="text-yellow-400">SESSION:</span> Residuals Processing Demo
                    </div>
                    <div className="text-xs text-green-400 font-mono">ACTIVE</div>
                  </div>

                  {/* Animated conversation content */}
                  <div className="p-4 font-mono text-sm min-h-[280px] max-h-[400px] overflow-y-auto">
                    <AnimatedTerminalConversation />
                  </div>

                  {/* Feature icons bar */}
                  <div className="border-t border-yellow-400/10 px-4 py-3 bg-[#0a0a0f]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-400">Auto-Import</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-400">AI Matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-400">Smart Reports</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Neural sync bar */}
                  <div className="border-t border-yellow-400/10 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-400 font-mono text-xs">NEURAL SYNC</span>
                      <span className="text-yellow-400 font-mono text-xs">{neuralSync}%</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-300"
                        style={{ width: `${neuralSync}%` }}
                      />
                    </div>
                  </div>

                  {/* Secure connection indicator */}
                  <div className="absolute -bottom-4 -right-4 bg-[#0d0d12] border border-yellow-400/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-400 font-mono text-xs">SECURE CONNECTION</span>
                    </div>
                    <div className="text-yellow-400 font-mono text-xs mt-1">ISOHUB V2.0</div>
                  </div>
                </div>
              </CornerBrackets>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 border-t border-yellow-400/10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-6">
              <Terminal className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-mono text-sm">EVERYTHING IN ONE PLACE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              YOUR ISO <span className="text-yellow-400">COMMAND CENTER</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Stop juggling spreadsheets, processor portals, and constant rep questions. One platform. Total control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature cards with glassmorphism */}
            {[
              {
                icon: TrendingUp,
                title: "Automated Residuals",
                description: "Import processor files and watch commissions calculate instantly. No more Excel formulas, VLOOKUP nightmares, or month-end panic. Done in seconds, not days.",
                highlight: "SECONDS, NOT DAYS"
              },
              {
                icon: Shield,
                title: "Rep Self-Service Portal",
                description: "Reps log in and see their own commissions, MIDs, and performance data. No more \"where's my check?\" calls. No more interruptions. Ever.",
                highlight: "ZERO REP CALLS"
              },
              {
                icon: Database,
                title: "CRM Data Integration",
                description: "Connect your existing data sources. ISOHUB becomes your single source of truth pulling everything together so you're not hunting across 5 different systems.",
                highlight: "ONE HUB"
              },
              {
                icon: FileSearch,
                title: "Instant Reports & Analytics",
                description: "Real-time dashboards showing portfolio health, rep performance, revenue trends, and attrition alerts. See the data that matters, when you need it.",
                highlight: "REAL-TIME"
              },
              {
                icon: Brain,
                title: "AI-Powered Insights",
                description: "Claude and GPT-4o analyze your portfolio, flag at-risk merchants, identify growth opportunities, and even draft proposals. Your AI analyst works 24/7.",
                highlight: "AI INCLUDED"
              },
              {
                icon: Zap,
                title: "Statement Analysis",
                description: "Upload merchant statements and get instant competitive analysis. AI extracts rates, calculates savings, and generates proposals in under a minute.",
                highlight: "< 60 SECONDS"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-b from-[#12121a] to-[#0d0d12] border border-yellow-400/10 rounded-xl p-6 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/5"
              >
                {/* Highlight badge */}
                <div className="absolute -top-3 right-4 bg-yellow-400/10 border border-yellow-400/30 rounded px-2 py-1">
                  <span className="text-yellow-400 font-mono text-xs">{feature.highlight}</span>
                </div>

                <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-400/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ISO AI Agent Section */}
      <section id="ai-agent" className="relative py-24 bg-gradient-to-b from-[#0d0d15] to-[#0a0a0f] border-t border-yellow-400/10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-6">
                <Brain className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-mono text-sm">YOUR 24/7 ISO EXPERT</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                MEET YOUR <span className="text-yellow-400">ISO AI AGENT</span>
              </h2>

              <p className="text-xl text-gray-300 mb-6">
                Trained specifically for merchant services. Your AI agent knows interchange, residuals,
                processor nuances, and ISO operations inside and out.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Answer rep questions instantly \"What's my commission on MID 4521?\"",
                  "Explain residual calculations and split structures",
                  "Help reps understand their statements and payouts",
                  "Draft merchant proposals with competitive rate analysis",
                  "Flag portfolio anomalies and at-risk accounts",
                  "Train new reps on products, pricing, and processes"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-400/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-yellow-400" />
                    </div>
                    <span className="text-gray-400">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-lg text-gray-500 italic">
                "It's like having a senior ISO operations manager available 24/7 for you AND your reps."
              </p>
            </div>

            {/* Right side - Chat Demo */}
            <div className="relative">
              <CornerBrackets className="p-1">
                <div className="bg-[#0d0d12] border border-yellow-400/20 rounded-lg overflow-hidden">
                  {/* Chat header */}
                  <div className="border-b border-yellow-400/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">ISO AI Agent</div>
                        <div className="text-green-400 text-xs flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Online
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 font-mono text-xs">POWERED BY CLAUDE</span>
                  </div>

                  {/* Chat messages */}
                  <div className="p-4 space-y-4 min-h-[320px]">
                    {/* User message 1 */}
                    <div className="flex justify-end">
                      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg rounded-br-none px-4 py-2 max-w-[80%]">
                        <p className="text-gray-300 text-sm">Hey, what was my commission for October?</p>
                      </div>
                    </div>

                    {/* AI response 1 */}
                    <div className="flex justify-start">
                      <div className="bg-[#1a1a24] border border-gray-700 rounded-lg rounded-bl-none px-4 py-2 max-w-[80%]">
                        <p className="text-gray-300 text-sm">
                          Hi Mike! Your October commission was <span className="text-yellow-400 font-semibold">$4,832.50</span> across 47 active MIDs.
                          That's up 12% from September. Your top performer was MID 7821 (Downtown Cafe) at $312/month.
                          Want me to break it down by processor?
                        </p>
                      </div>
                    </div>

                    {/* User message 2 */}
                    <div className="flex justify-end">
                      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg rounded-br-none px-4 py-2 max-w-[80%]">
                        <p className="text-gray-300 text-sm">Why did MID 3392 drop so much?</p>
                      </div>
                    </div>

                    {/* AI response 2 */}
                    <div className="flex justify-start">
                      <div className="bg-[#1a1a24] border border-gray-700 rounded-lg rounded-bl-none px-4 py-2 max-w-[80%]">
                        <p className="text-gray-300 text-sm">
                          MID 3392 (Tony's Auto Shop) volume dropped 68% from $23K to $7.4K.
                          Looks like they may have added a second processor. I'd recommend a retention call.
                          Want me to pull their full history and draft talking points?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chat input */}
                  <div className="border-t border-yellow-400/10 px-4 py-3">
                    <div className="flex items-center gap-2 bg-[#1a1a24] rounded-lg px-3 py-2">
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-sm">Ask your ISO AI Agent anything...</span>
                    </div>
                  </div>
                </div>
              </CornerBrackets>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section - GLBA & PCI DSS 4.0 Compliant */}
      <section id="security" className="relative py-24 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d15] border-t border-yellow-400/10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-mono text-sm">USA FINANCIAL COMPLIANCE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              ENTERPRISE-GRADE <span className="text-yellow-400">SECURITY</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built for GLBA Safeguards Rule and PCI DSS 4.0 compliance. Your sensitive financial data is protected with bank-level security standards.
            </p>
          </div>

          {/* Primary Security Badges */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { 
                badge: "AES-256\nGCM", 
                title: "Field-Level Encryption", 
                desc: "SSNs, EINs, and bank accounts encrypted with authenticated AES-256-GCM encryption",
                compliance: "GLBA Required"
              },
              { 
                badge: "2FA\nTOTP", 
                title: "Two-Factor Authentication", 
                desc: "TOTP-based MFA with QR codes and backup recovery codes for enhanced account security",
                compliance: "PCI DSS 4.0"
              },
              { 
                badge: "12+\nCHARS", 
                title: "Strong Password Policy", 
                desc: "PCI DSS 4.0 compliant passwords with complexity requirements and lockout protection",
                compliance: "PCI DSS 4.0"
              }
            ].map((item, index) => (
              <CornerBrackets key={index} className="p-1">
                <div className="bg-[#0d0d12] border border-yellow-400/10 rounded-lg p-8 text-center h-full relative">
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded">
                      {item.compliance}
                    </span>
                  </div>
                  <div className="w-20 h-20 bg-yellow-400/10 border border-yellow-400/30 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <span className="text-yellow-400 font-bold text-sm whitespace-pre-line">{item.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </CornerBrackets>
            ))}
          </div>

          {/* Secondary Security Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔒", title: "HTTPS/TLS", desc: "Encrypted transit" },
              { icon: "🛡️", title: "Rate Limiting", desc: "DDoS protection" },
              { icon: "👥", title: "RBAC", desc: "Role isolation" },
              { icon: "📋", title: "Audit Logs", desc: "Full traceability" }
            ].map((item, index) => (
              <div key={index} className="bg-[#0d0d12]/50 border border-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-white font-semibold text-sm">{item.title}</div>
                <div className="text-gray-500 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Compliance Statement */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm max-w-3xl mx-auto">
              ISOHub implements security controls aligned with the <span className="text-yellow-400">Gramm-Leach-Bliley Act (GLBA)</span> Safeguards Rule 
              and <span className="text-yellow-400">PCI DSS 4.0</span> requirements for handling nonpublic personal information and payment data.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="relative py-24 border-t border-yellow-400/10">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-8">
              <Lock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-mono text-sm">YOUR TIME IS VALUABLE</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              READY TO TAKE <span className="text-yellow-400">CONTROL?</span>
            </h2>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Stop wasting hours on residual calculations and rep questions. ISOHUB connects your entire ISO under one roof so you can focus on growth, not spreadsheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-10 py-6 text-lg"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  ACCESS PORTAL
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-white hover:bg-white/5 px-10 py-6 text-lg"
              >
                Book a Demo Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-400/10 py-12">
        <div className="container mx-auto px-8 md:px-12 lg:px-16 xl:px-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img
                src="/isohub-logo.png"
                alt="ISOHub"
                className="h-20 w-auto"
              />
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/login" className="hover:text-yellow-400 transition-colors">Portal</Link>
              <span>•</span>
              <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
              <span>•</span>
              <a href="#ai-agent" className="hover:text-yellow-400 transition-colors">AI Agent</a>
              <span>•</span>
              <a href="#security" className="hover:text-yellow-400 transition-colors">Security</a>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-500 font-mono text-xs">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-yellow-400/10 text-center text-gray-600 text-sm">
            © 2025 ISOHub. All rights reserved. <span className="text-yellow-400/50">|</span> The Command Center for Merchant Services ISOs
          </div>
        </div>
      </footer>
    </div>
  );
}
