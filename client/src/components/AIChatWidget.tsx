import React, { useState, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatWidgetProps {
  className?: string;
}

export default function AIChatWidget({ className = '' }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={handleToggleChat}
          className="rounded-full w-14 h-14 bg-yellow-400 hover:bg-yellow-500 text-black shadow-lg transition-all duration-300 hover:scale-105"
          data-testid="button-chat-toggle"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        } transition-all duration-300`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-yellow-400 text-black rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold text-sm">ISO Hub AI Assistant</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                onClick={handleMinimize}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-yellow-500 text-black"
                data-testid="button-minimize-chat"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-yellow-500 text-black"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content - Iframe */}
          {!isMinimized && (
            <div className="relative h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading ISO Hub AI...</p>
                  </div>
                </div>
              )}
              
              <iframe
                ref={iframeRef}
                src="https://jacc.kean-on-biz.replit.app/"
                className="w-full h-[536px] border-0"
                onLoad={handleIframeLoad}
                title="ISO Hub AI Assistant"
                allow="microphone; camera; clipboard-read; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                data-testid="iframe-ai-chat"
              />
            </div>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600">ISO Hub AI - Click to expand</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}