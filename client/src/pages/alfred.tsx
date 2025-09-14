import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Mic, Send, Calendar, Target, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'alfred';
  timestamp: Date;
}

const quickPrompts = [
  { text: "Plan my week", icon: Calendar },
  { text: "Break down this goal", icon: Target },
  { text: "Give me suggestions", icon: Lightbulb }
];

export default function AlfredPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Good day, Master Wayne. I am ALFRED, your strategic assistant. How may I assist you with your productivity endeavors today?",
      sender: 'alfred',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasPlayedEntrance, setHasPlayedEntrance] = useState(false);

  // Cinematic entrance animation
  useEffect(() => {
    if (pageRef.current && !hasPlayedEntrance) {
      setHasPlayedEntrance(true);
      const tl = gsap.timeline();
      
      // Screen fade to black, then show bat emblem
      tl.fromTo(pageRef.current, 
        { opacity: 0, backgroundColor: '#000000' },
        { opacity: 1, duration: 0.5 }
      )
      .to(pageRef.current, {
        backgroundColor: 'transparent',
        duration: 1,
        ease: 'power2.out'
      })
      // Holographic distortion effect on the main panel
      .fromTo('.alfred-panel', 
        { 
          opacity: 0, 
          scale: 0.95,
          filter: 'blur(10px) brightness(1.5)',
          rotationX: -15
        },
        { 
          opacity: 1,
          scale: 1,
          filter: 'blur(0px) brightness(1)',
          rotationX: 0,
          duration: 1.5,
          ease: 'power3.out'
        }
      );
    }
  }, [hasPlayedEntrance]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typewriter effect for Alfred's messages
  const addAlfredMessage = (text: string) => {
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      text: '',
      sender: 'alfred',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Typewriter effect
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
    }, 30);
  };

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
          context: messages.slice(-6).map(msg => ({ sender: msg.sender, text: msg.text })) // Send last 6 messages for context
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
          "I apologize, Master Wayne, but my systems are currently offline. The BATCAVE administrator may need to configure the GEMINI_API_KEY for my AI capabilities to function properly."
        );
      } else {
        addAlfredMessage(
          "I apologize, Master Wayne, but I'm experiencing communication difficulties at the moment. Please check your connection and try again shortly."
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
  };

  return (
    <div ref={pageRef} className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <h1 className="font-orbitron text-lg font-bold text-primary tracking-wider">
            ALFRED — Your Strategic Assistant
          </h1>
          <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent ml-4"></div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col alfred-panel">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card 
                className={`
                  max-w-[80%] p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg
                  ${message.sender === 'alfred' 
                    ? 'bg-card/80 border-primary/20 shadow-lg shadow-primary/5' 
                    : 'bg-primary/10 border-primary/30 ml-auto'
                  }
                `}
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                {message.sender === 'alfred' && (
                  <div className="flex items-center space-x-2 mb-2 opacity-70">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span className="text-xs font-orbitron tracking-wider text-primary">ALFRED</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed font-inter">
                  {message.text}
                  {message.sender === 'alfred' && message.text && (
                    <span className="inline-block w-2 h-4 bg-primary/70 ml-1 animate-pulse"></span>
                  )}
                </p>
                <div className="text-xs text-muted-foreground mt-2 opacity-50">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card/80 border-primary/20 p-4 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">ALFRED is thinking...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-6 pb-3">
          <div className="flex gap-2 flex-wrap">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="hover-elevate transition-all duration-200 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => handleQuickPrompt(prompt.text)}
              >
                <prompt.icon className="h-3 w-3 mr-1" />
                {prompt.text}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-card/30 backdrop-blur-sm p-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask ALFRED for assistance..."
                className="pr-12 bg-background/50 border-primary/30 focus:border-primary/60 transition-colors"
                disabled={isLoading}
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary/10"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="hover-elevate"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}