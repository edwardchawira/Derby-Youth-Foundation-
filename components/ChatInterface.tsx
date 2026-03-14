'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Loader2, Bot, User, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatInterfaceProps {
  className?: string;
  embedded?: boolean; // When true, removes Card wrapper and header
  onClose?: () => void; // Callback for close button
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Helper function to extract product names from text and make them clickable
const parseMessageContent = (content: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pattern to match UUIDs (product IDs)
  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
  
  // Pattern to match common product mention patterns
  // Matches: "product X", "the X", or quoted product names
  const productNamePattern = /(?:product|item)\s+(?:ID:\s*)?([A-Z][a-zA-Z0-9\s&-]+?)(?:\s|,|\.|$|:)/gi;
  
  // Pattern for quoted product names: "Product Name"
  const quotedProductPattern = /"([^"]{2,50})"/g;
  
  // Pattern for bullet points or list items with product names
  const listProductPattern = /(?:[-•]\s*|^\d+\.\s*)([A-Z][a-zA-Z0-9\s&-]{3,50}?)(?:\s*[-–]|\s*£|\s*\$|$)/gm;

  // First, handle UUIDs (definitive product IDs)
  let uuidMatch;
  const processedRanges: Array<{ start: number; end: number }> = [];

  while ((uuidMatch = uuidPattern.exec(content)) !== null) {
    const productId = uuidMatch[0];
    const startIndex = uuidMatch.index;
    const endIndex = startIndex + productId.length;

    // Check if this UUID is already processed
    if (processedRanges.some(r => startIndex >= r.start && endIndex <= r.end)) {
      continue;
    }

    // Add text before match
    if (startIndex > lastIndex) {
      const beforeText = content.substring(lastIndex, startIndex);
      // Process other patterns in the before text
      parts.push(parseTextForProducts(beforeText, processedRanges));
    }

    // Add clickable link for product ID
    parts.push(
      <Link
        key={`uuid-${startIndex}`}
        href={`/products/${productId}`}
        className="text-primary hover:text-secondary underline font-medium transition-colors"
      >
        {productId}
      </Link>
    );

    processedRanges.push({ start: startIndex, end: endIndex });
    lastIndex = endIndex;
  }

  // Process remaining text for product names
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    parts.push(parseTextForProducts(remainingText, processedRanges));
  }

  // If no matches found, return original content
  if (parts.length === 0) {
    return content;
  }

  return <>{parts}</>;
};

// Helper to parse text for product name patterns
const parseTextForProducts = (
  text: string,
  processedRanges: Array<{ start: number; end: number }>
): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match quoted product names
  const quotedMatch = text.match(/"([^"]{2,50})"/g);
  if (quotedMatch) {
    for (const match of quotedMatch) {
      const index = text.indexOf(match, lastIndex);
      if (index === -1) continue;

      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }

      const productName = match.replace(/"/g, '');
      parts.push(
        <Link
          key={`quoted-${index}`}
          href={`/products?search=${encodeURIComponent(productName)}`}
          className="text-primary hover:text-secondary underline font-medium transition-colors break-words"
          style={{ wordBreak: 'break-word' }}
        >
          {match}
        </Link>
      );

      lastIndex = index + match.length;
    }
  }

  // Match "product X" patterns
  const productPattern = /(?:product|item)\s+([A-Z][a-zA-Z0-9\s&-]{2,50}?)(?:\s|,|\.|$|:)/gi;
  let productMatch;
  while ((productMatch = productPattern.exec(text)) !== null) {
    const startIndex = productMatch.index;
    const endIndex = startIndex + productMatch[0].length;

    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    const productName = productMatch[1].trim();
    parts.push(
      <Link
        key={`product-${startIndex}`}
        href={`/products?search=${encodeURIComponent(productName)}`}
        className="text-primary hover:text-secondary underline font-medium transition-colors break-words"
        style={{ wordBreak: 'break-word' }}
      >
        {productMatch[0]}
      </Link>
    );

    lastIndex = endIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

export function ChatInterface({ className, embedded = false, onClose }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();

  // Handle sending messages
  const submitMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          ...(threadId && { threadId }), // Only include threadId if it exists
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentAssistantMessage = '';
      let assistantMessageId = `assistant-${Date.now()}`;
      let currentThreadId = threadId;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;

            // Parse SSE format: "0:data"
            const match = line.match(/^0:(.+)$/);
            if (match) {
              try {
                const data = JSON.parse(match[1]);

                if (data.type === 'thread' && data.threadId) {
                  currentThreadId = data.threadId;
                  setThreadId(data.threadId);
                } else if (data.type === 'text' && data.text) {
                  currentAssistantMessage += data.text;
                  setIsThinking(false);
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === assistantMessageId);
                    if (existing) {
                      return prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: currentAssistantMessage }
                          : m
                      );
                    } else {
                      return [
                        ...prev,
                        {
                          id: assistantMessageId,
                          role: 'assistant' as const,
                          content: currentAssistantMessage,
                          timestamp: new Date(),
                        },
                      ];
                    }
                  });
                } else if (data.type === 'done') {
                  setIsThinking(false);
                } else if (data.type === 'error') {
                  setIsThinking(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `error-${Date.now()}`,
                      role: 'assistant',
                      content: `Error: ${data.error}`,
                      timestamp: new Date(),
                    },
                  ]);
                }
              } catch (e) {
                // Ignore JSON parse errors for malformed chunks
              }
            }
          }
        }
      }
    } catch (error: any) {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error.message || 'Failed to send message'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use a small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isLoading, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      submitMessage();
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const content = (
    <div className={cn('flex flex-col h-full', embedded ? '' : 'h-[600px]')}>
      {!embedded && (
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-accent/80">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Derby Youth Foundation Assistant</h3>
          </div>
          {(isLoading || isThinking) && (
            <div className="ml-auto flex items-center gap-2 text-xs text-primary-foreground/70">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      )}
      {embedded && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-accent/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Derby Youth Foundation Assistant</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(isLoading || isThinking) && (
              <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-accent/60"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 overflow-hidden">
          <div ref={scrollRef} className="py-4 space-y-4 min-w-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-secondary" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Welcome I'm your Sales Assistant</h4>
                <p className="text-sm text-primary-foreground/70 max-w-md">
                  I can help you search for products, add items to your cart, and answer questions about our inventory.
                  Try asking me to search for something!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 w-full',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex gap-3 max-w-[85%] min-w-0',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-primary'
                        : 'bg-gradient-to-br from-primary to-accent'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm min-w-0 max-w-full',
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-accent/90 text-primary-foreground border border-primary/30'
                    )}
                    style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-primary-foreground whitespace-pre-wrap break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
                        {parseMessageContent(message.content)}
                      </div>
                    ) : (
                      <div className="text-white break-words" style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</div>
                    )}
                    {message.timestamp && (
                      <div
                        className={cn(
                          'text-xs mt-1.5',
                          message.role === 'user' ? 'text-primary-foreground/80' : 'text-primary-foreground/70'
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex gap-3 w-full justify-start">
                <div className="flex gap-3 max-w-[85%] min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-accent/90 text-primary-foreground border border-primary/30 rounded-2xl px-4 py-2.5 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-accent/40">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="Ask about products, search inventory, or add items to cart..."
              disabled={isLoading}
              className="flex-1 bg-accent/60 border-border text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary focus-visible:border-primary"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-r bg-primary hover:bg-primary/90 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-primary-foreground/60 mt-2 text-center">
            {!isLoading && 'Ready to help'}
            {isLoading && 'Processing your request...'}
          </p>
        </div>
    </div>
  );

  if (embedded) {
    return <div className={cn('flex flex-col h-full bg-accent', className)}>{content}</div>;
  }

  return (
    <Card className={cn('flex flex-col h-[600px] bg-accent border-border shadow-2xl', className)}>
      <CardContent className="flex flex-col h-full p-0">{content}</CardContent>
    </Card>
  );
}