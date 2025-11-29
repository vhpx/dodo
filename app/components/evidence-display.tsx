'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { Evidence } from '../../types/game.types';

interface EvidenceDisplayProps {
  evidence: Evidence[];
}

export function EvidenceDisplay({ evidence }: EvidenceDisplayProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.FileQuestion;
    return IconComponent;
  };

  return (
    <div className="w-full">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-xl font-semibold text-center"
      >
        Evidence Against You
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidence.map((item, index) => {
          const Icon = getIcon(item.icon);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="border-red-500/20 bg-red-950/10 hover:bg-red-950/20 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-red-500" />
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
