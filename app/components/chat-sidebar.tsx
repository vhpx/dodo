'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Gavel, MessageSquare, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/game.types';

interface ChatSidebarProps {
  messages: ChatMessage[];
  isOpen: boolean;
}

export function ChatSidebar({ messages, isOpen }: ChatSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border/50 bg-zinc-900/80 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <MessageSquare className="h-4 w-4 text-violet-400" />
        <span className="font-semibold text-sm text-zinc-100">Transcript</span>
        <span className="ml-auto text-xs text-zinc-500">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        <div className="py-3 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">No messages yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                The conversation transcript will appear here
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  const isProsecutor = message.role === 'prosecutor';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-2.5 transition-colors rounded-lg p-2 -mx-2',
        'hover:bg-zinc-800/30'
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          'h-8 w-8 flex-shrink-0 ring-2 ring-offset-1 ring-offset-zinc-900',
          isProsecutor ? 'ring-red-500/50' : 'ring-emerald-500/50'
        )}
      >
        <AvatarFallback
          className={cn(
            'text-xs font-bold',
            isProsecutor
              ? 'bg-gradient-to-br from-red-600 to-red-800 text-red-100'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-emerald-100'
          )}
        >
          {isProsecutor ? <Gavel className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-semibold text-sm',
              isProsecutor ? 'text-red-400' : 'text-emerald-400'
            )}
          >
            {isProsecutor ? 'Prosecutor' : 'You'}
          </span>
          <span className="text-[10px] text-zinc-600">
            {format(message.timestamp, 'HH:mm:ss')}
          </span>
        </div>
        <p
          className={cn(
            'text-sm text-zinc-300 mt-0.5 leading-relaxed break-words',
            message.isStreaming && 'animate-pulse'
          )}
        >
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-zinc-400 animate-pulse rounded-sm" />
          )}
        </p>
      </div>
    </div>
  );
}

