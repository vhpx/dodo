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
    <div className="flex h-2 overflow-hidden bg-background">
      <div className="flex-none">
        <motion.aside
          layout="position"
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'w-20' : 'w-[400px]'
          )}
        >
          <SidePanel
            onCollapse={handleCollapse}
            isCollapsed={sidebarCollapsed}
          />
        </motion.aside>
      </div>

      <motion.main layout="position" className="relative h-full flex-1">
        {!connected && (
          <Alert
            variant="destructive"
            className="absolute top-4 right-4 left-4 z-50"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect to start using the application
            </AlertDescription>
          </Alert>
        )}
      </motion.main>
    </div>
  );
}
