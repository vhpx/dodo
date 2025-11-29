'use client';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
// Add this directive
import { cn } from '@/lib/utils';
import 'overlayscrollbars/overlayscrollbars.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationViewProps {
  messages: Message[];
  currentTranscript?: string;
}

export function ConversationView({
  messages,
  currentTranscript,
}: ConversationViewProps) {
  return (
    <OverlayScrollbarsComponent
      defer
      options={{
        scrollbars: {
          theme: 'os-theme-dark',
          autoHide: 'move',
        },
      }}
      className="h-full"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl p-4',
                message.role === 'user'
                  ? 'ml-12 bg-blue-500/10'
                  : 'mr-12 bg-neutral-800/50'
              )}
            >
              <div className="mb-1 text-sm text-neutral-400">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="text-sm whitespace-pre-wrap text-neutral-200">
                {message.content}
              </div>
            </div>
          ))}

          {/* Live Transcript */}
          {currentTranscript && (
            <div className="mr-12 rounded-xl bg-neutral-800/30 p-4">
              <div className="mb-1 text-sm text-neutral-400">
                Assistant (typing...)
              </div>
              <div className="whitespace-pre-wrap text-neutral-200">
                {currentTranscript}
              </div>
            </div>
          )}
        </div>
      </div>
    </OverlayScrollbarsComponent>
  );
}
