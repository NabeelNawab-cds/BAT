import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, Send, X, Calendar, Target, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'alfred';
  timestamp: Date;
}

interface AlfredPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickPrompts = [
  { text: "Plan my week", icon: Calendar },
  { text: "Break down this goal", icon: Target },
  { text: "Give me suggestions", icon: Lightbulb }
];

export function AlfredPanel({ isOpen, onClose }: AlfredPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Good day, Master Wayne. I am at your service. How may I assist you with your productivity endeavors?",
      sender: 'alfred',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GSAP Animation for panel open/close
  useEffect(() => {
    if (panelRef.current) {
      if (isOpen) {
        // Elastic slide-in from right with holographic flicker
        gsap.fromTo(panelRef.current, 
          { 
            x: '100%',
            opacity: 0,
            filter: 'blur(8px) brightness(1.3)',
            scale: 0.95
          },
          { 
            x: '0%',
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
            scale: 1,
            duration: 0.8,
            ease: 'elastic.out(1, 0.75)',
            onComplete: () => {
              // Subtle holographic flicker effect on completion
              gsap.to(panelRef.current, {
                filter: 'brightness(1.1)',
                duration: 0.1,
                yoyo: true,
                repeat: 3
              });
            }
          }
        );
        
        // Animate background overlay
        gsap.fromTo('.alfred-overlay', 
          { opacity: 0 },
          { opacity: 1, duration: 0.3 }
        );
      } else {
        // Smooth slide-out with trailing particles effect
        gsap.to(panelRef.current, {
          x: '100%',
          opacity: 0,
          filter: 'blur(4px)',
          scale: 0.98,
          duration: 0.6,
          ease: 'power3.inOut'
        });
        
        gsap.to('.alfred-overlay', {
          opacity: 0,
          duration: 0.3
        });
      }
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Typewriter effect for Alfred's messages
  const addAlfredMessage = useCallback((text: string) => {
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      text: '',
      sender: 'alfred',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Typewriter effect with typing sound simulation
    let i = 0;
    const typeInterval = setInterval(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: text.slice(0, i + 1) }
            : msg
        )
      );
      i++;
      if (i >= text.length) {
        clearInterval(typeInterval);
      }
    }, 25);
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Send message to ALFRED AI
      const response = await fetch('/api/alfred/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context: messages.slice(-5).map(msg => ({ sender: msg.sender, text: msg.text })) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      addAlfredMessage(data.response);
    } catch (error) {
      console.error('ALFRED communication error:', error);
      
      // Provide specific error messages based on the error type  
      if (error instanceof Error && error.message.includes('401')) {
        addAlfredMessage(
          "I apologize, Master Wayne, but you need to be authenticated to use my services. Please ensure you're logged in to the BATCAVE system."
        );
      } else if (error instanceof Error && error.message.includes('500')) {
        addAlfredMessage(
          "I apologize, Master Wayne, but my AI systems are currently offline. The BATCAVE administrator may need to configure the GEMINI_API_KEY environment variable to restore my capabilities."
        );
      } else {
        addAlfredMessage(
          "I apologize, Master Wayne, but I'm experiencing communication difficulties. Please check your connection and try again in a moment."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background Overlay */}
      <div 
        className="alfred-overlay fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Alfred Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-xl border-l border-primary/20 shadow-2xl shadow-primary/10 z-50 flex flex-col"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--background))/95% 100%)',
          backdropFilter: 'blur(20px) saturate(1.2)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-card/30">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <span className="font-orbitron text-sm font-bold text-primary tracking-wider">
              ALFRED
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-primary/10 hover-elevate"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card 
                className={`
                  max-w-[85%] p-3 backdrop-blur-sm transition-all duration-300
                  ${message.sender === 'alfred' 
                    ? 'bg-card/60 border-primary/20 shadow-md shadow-primary/5' 
                    : 'bg-primary/15 border-primary/30'
                  }
                `}
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                {message.sender === 'alfred' && (
                  <div className="flex items-center space-x-1 mb-1 opacity-60">
                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                    <span className="text-xs font-orbitron tracking-wider">ALFRED</span>
                  </div>
                )}
                <p className="text-xs leading-relaxed">
                  {message.text}
                  {message.sender === 'alfred' && message.text && (
                    <span className="inline-block w-1 h-3 bg-primary/70 ml-0.5 animate-pulse"></span>
                  )}
                </p>
                <div className="text-xs text-muted-foreground mt-1 opacity-40">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card/60 border-primary/20 p-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">Analyzing...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 pb-2">
          <div className="flex gap-1 flex-wrap">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs hover-elevate transition-all duration-200 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                onClick={() => handleQuickPrompt(prompt.text)}
              >
                <prompt.icon className="h-3 w-3 mr-1" />
                {prompt.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-primary/20 bg-card/20 p-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask ALFRED..."
                className="text-sm pr-8 bg-background/40 border-primary/30 focus:border-primary/60"
                disabled={isLoading}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary/10"
              >
                <Mic className="h-3 w-3" />
              </Button>
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              size="sm"
              className="hover-elevate"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 opacity-50 text-center">
            Press <kbd className="px-1 py-0.5 bg-primary/10 rounded text-xs">Esc</kbd> to close • <kbd className="px-1 py-0.5 bg-primary/10 rounded text-xs">Ctrl+Space</kbd> to reopen
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        kbd {
          font-family: monospace;
        }
      `}</style>
    </>
  );
}