'use client';

export const dynamic = 'force-dynamic';

import SidePanel from '../components/side-panel/side-panel';
import { LegacyProviders } from '@/app/legacy-providers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useLiveAPIContext } from '@/hooks/use-live-api';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

export default function ChatPage() {
  return (
    <LegacyProviders>
      <ChatContent />
    </LegacyProviders>
  );
}

function ChatContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { connected } = useLiveAPIContext();
  const handleCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Noir background effects */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, oklch(0.95 0.05 70 / 0.04) 0%, transparent 50%)'
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Sidebar - One-way mirror effect */}
      <div className="flex-none relative z-10">
        <motion.aside
          layout="position"
          className={cn(
            'h-full transition-all duration-300 ease-in-out border-r border-primary/20',
            'bg-card/50 backdrop-blur-sm',
            sidebarCollapsed ? 'w-20' : 'w-[400px]'
          )}
        >
          <SidePanel
            onCollapse={handleCollapse}
            isCollapsed={sidebarCollapsed}
          />
        </motion.aside>
      </div>

      {/* Main interview room area */}
      <motion.main layout="position" className="relative h-full flex-1 z-10">
        {/* Recording indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
          <motion.div
            className="w-2 h-2 rounded-full bg-destructive"
            animate={{ opacity: connected ? [1, 0.3, 1] : 0.3 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {connected ? 'Recording' : 'Standby'}
          </span>
        </div>

        {/* Header */}
        <div className="absolute top-4 right-4 left-20 z-40">
          <div className="text-right">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Interview Room</h1>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Session Active</p>
          </div>
        </div>

        {!connected && (
          <Alert
            variant="destructive"
            className="absolute top-16 right-4 left-4 z-50 border-destructive/30 bg-destructive/10"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              Awaiting connection to initiate interview session
            </AlertDescription>
          </Alert>
        )}

        {/* Center content area with subtle vignette */}
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-4 grayscale opacity-30">🎙️</div>
            <p className="text-sm font-mono uppercase tracking-wider">
              {connected ? 'Session in progress' : 'Connect to begin interview'}
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
