'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { cn } from '@/lib/utils';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed z-50',
            'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
            'sm:bottom-6 sm:right-6',
            'h-14 w-14 touch-target min-h-[44px] min-w-[44px]',
            'rounded-full shadow-2xl',
            'bg-primary',
            'hover:bg-primary/90',
            'text-primary-foreground border-0',
            'flex items-center justify-center',
            'transition-all duration-300 ease-in-out',
            'hover:scale-110 hover:shadow-primary/40',
            'group'
          )}
          size="icon"
          aria-label="Open AI Chat Assistant"
        >
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed z-50',
            'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
            'sm:bottom-6 sm:right-6',
            'w-[calc(100vw-2rem)] sm:w-[400px]',
            'h-[calc(100vh-8rem)] sm:h-[600px]',
            'max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-12rem)]',
            'transition-all duration-300 ease-in-out',
            'animate-in slide-in-from-bottom-5 fade-in-0',
            'rounded-lg'
          )}
        >
          <Card className="bg-accent border-border shadow-2xl overflow-hidden h-full rounded-t-lg md:rounded-lg">
            {/* Chat Interface */}
            <div className="h-full">
              <ChatInterface 
                className="h-full border-0 shadow-none" 
                embedded={true}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
