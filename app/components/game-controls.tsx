'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MessageSquare, Mic, MicOff, PhoneOff } from 'lucide-react';

interface GameControlsProps {
  isRecording: boolean;
  isUserSpeaking: boolean;
  onToggleMic: () => void;
  onEndConversation?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  disabled?: boolean;
  timeRemaining?: number;
}

export function GameControls({
  isRecording,
  isUserSpeaking,
  onToggleMic,
  onEndConversation,
  onToggleChat,
  isChatOpen = false,
  disabled = false,
  timeRemaining = 60,
}: GameControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeRemaining <= 10;

  return (
    <TooltipProvider>
      <div className="h-20 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/50">
        <div className="h-full flex items-center justify-between px-6">
          {/* Left side - Timer & Status */}
          <div className="flex items-center gap-4 min-w-[180px]">
            {/* Timer */}
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                isUrgent
                  ? 'bg-red-500/20 text-red-400'
                  : timeRemaining <= 30
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-zinc-800/50 text-zinc-300'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                )}
              />
              <span className={cn('font-mono text-lg font-bold tabular-nums', isUrgent && 'animate-pulse')}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Center - Main Controls */}
          <div className="flex items-center gap-3">
            {/* Microphone Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className={cn(
                    'h-14 w-14 rounded-full transition-all duration-200',
                    isRecording
                      ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50',
                    isUserSpeaking && isRecording && 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
                  )}
                  onClick={onToggleMic}
                  disabled={disabled}
                  aria-label={isRecording ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {isRecording ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                {isRecording ? 'Mute (M)' : 'Unmute (M)'}
              </TooltipContent>
            </Tooltip>

            {/* End Call Button */}
            {onEndConversation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200"
                    onClick={onEndConversation}
                    disabled={disabled}
                    aria-label="End conversation"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Leave
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                  End Call
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Right side - Chat Toggle & Info */}
          <div className="flex items-center gap-3 min-w-[180px] justify-end">
            {/* Voice indicator */}
            {isRecording && (
              <div className="flex gap-0.5 mr-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-0.5 rounded-full transition-all duration-150',
                      isUserSpeaking ? 'bg-emerald-500 h-4' : 'bg-zinc-600 h-2'
                    )}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      transform: isUserSpeaking ? `scaleY(${0.5 + Math.random() * 0.5})` : 'scaleY(1)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Chat Toggle Button */}
            {onToggleChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="ghost"
                    className={cn(
                      'h-12 w-12 rounded-lg transition-all duration-200',
                      isChatOpen
                        ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    )}
                    onClick={onToggleChat}
                    aria-label="Toggle chat"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-zinc-800 text-zinc-100 border-zinc-700">
                  {isChatOpen ? 'Hide Chat' : 'Show Chat'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
