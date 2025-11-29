'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Gavel, Mic, MicOff, User, Volume2 } from 'lucide-react';

interface ParticipantCardsProps {
  isMicActive: boolean;
  isUserSpeaking: boolean;
  aiVolume: number;
  connected: boolean;
}

export function ParticipantCards({
  isMicActive,
  isUserSpeaking,
  aiVolume,
  connected,
}: ParticipantCardsProps) {
  const isAISpeaking = aiVolume > 0.05;

  return (
    <div className="flex-1 flex items-center justify-center gap-6 p-6">
      {/* Prosecutor Card (AI) */}
      <ParticipantCard
        name="Prosecutor"
        role="AI"
        icon={<Gavel className="h-12 w-12" />}
        isSpeaking={isAISpeaking}
        isConnected={connected}
        accentColor="red"
        volume={aiVolume}
      />

      {/* Defendant Card (User) */}
      <ParticipantCard
        name="You"
        role="Defendant"
        icon={<User className="h-12 w-12" />}
        isSpeaking={isUserSpeaking && isMicActive}
        isConnected={true}
        accentColor="emerald"
        isMuted={!isMicActive}
      />
    </div>
  );
}

interface ParticipantCardProps {
  name: string;
  role: string;
  icon: React.ReactNode;
  isSpeaking: boolean;
  isConnected: boolean;
  accentColor: 'red' | 'emerald';
  isMuted?: boolean;
  volume?: number;
}

function ParticipantCard({
  name,
  role,
  icon,
  isSpeaking,
  isConnected,
  accentColor,
  isMuted = false,
  volume = 0,
}: ParticipantCardProps) {
  const colorClasses = {
    red: {
      bg: 'from-red-950/80 to-zinc-900/90',
      border: 'border-red-500/30',
      borderActive: 'border-red-500',
      ring: 'ring-red-500/50',
      icon: 'text-red-400',
      accent: 'bg-red-500',
      text: 'text-red-400',
    },
    emerald: {
      bg: 'from-emerald-950/80 to-zinc-900/90',
      border: 'border-emerald-500/30',
      borderActive: 'border-emerald-500',
      ring: 'ring-emerald-500/50',
      icon: 'text-emerald-400',
      accent: 'bg-emerald-500',
      text: 'text-emerald-400',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <motion.div
      className={cn(
        'relative w-72 h-80 rounded-2xl overflow-hidden',
        'bg-gradient-to-br',
        colors.bg,
        'border-2 transition-all duration-300',
        isSpeaking ? colors.borderActive : colors.border,
        isSpeaking && 'shadow-lg shadow-current/20'
      )}
      animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Speaking indicator ring */}
      {isSpeaking && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-2xl ring-2',
            colors.ring,
            'pointer-events-none'
          )}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6">
        {/* Avatar */}
        <div
          className={cn(
            'relative w-28 h-28 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-zinc-800/80 to-zinc-900/80',
            'border-2',
            isSpeaking ? colors.borderActive : colors.border
          )}
        >
          <span className={colors.icon}>{icon}</span>

          {/* Audio visualizer for speaking */}
          {isSpeaking && (
            <div className="absolute -inset-2 rounded-full">
              <motion.div
                className={cn('absolute inset-0 rounded-full', colors.ring, 'ring-4')}
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          )}
        </div>

        {/* Name & Role */}
        <div className="mt-6 text-center">
          <h3 className="text-xl font-bold text-zinc-100">{name}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">{role}</p>
        </div>

        {/* Status indicators */}
        <div className="mt-4 flex items-center gap-3">
          {/* Connection status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-500'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              )}
            />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>

          {/* Mic/Audio status */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              isSpeaking
                ? `${colors.accent}/20 ${colors.text}`
                : isMuted
                  ? 'bg-zinc-700/50 text-zinc-500'
                  : 'bg-zinc-700/50 text-zinc-400'
            )}
          >
            {isMuted ? (
              <>
                <MicOff className="h-3 w-3" />
                Muted
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="h-3 w-3 animate-pulse" />
                Speaking
              </>
            ) : (
              <>
                <Mic className="h-3 w-3" />
                Ready
              </>
            )}
          </div>
        </div>

        {/* Audio bars (when speaking) */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={cn('w-1 rounded-full', colors.accent)}
                animate={{
                  height: [8, 16 + Math.random() * 16, 8],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

