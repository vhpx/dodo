'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cases, type CaseScenario } from '../data/cases';
import { Shuffle, ChevronRight, Mic, Clock, Target } from 'lucide-react';

interface IntroScreenProps {
  onSelectCase: (caseData: CaseScenario) => void;
}

export function IntroScreen({ onSelectCase }: IntroScreenProps) {
  const handleRandomCase = () => {
    const randomCase = cases[Math.floor(Math.random() * cases.length)];
    onSelectCase(randomCase);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Noir background effects */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-zinc-950 to-black" />
      
      {/* Multiple spotlight effects */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-gradient-radial from-red-500/5 to-transparent rounded-full blur-3xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />

      {/* Film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8 p-5 rounded-full bg-amber-500/10 border-2 border-amber-500/30 relative"
        >
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-500/30"
            animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <svg
            viewBox="0 0 24 24"
            className="w-14 h-14 text-amber-400"
            fill="currentColor"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-7xl font-black tracking-tight mb-2"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          DODO
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-3xl font-bold tracking-[0.4em] text-amber-400 mb-6"
        >
          INTERROGATION
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-6 max-w-md leading-relaxed"
        >
          You are a suspect in a crime. Defend yourself against Detective Dodo&apos;s 
          relentless questioning. Every word matters. Every detail counts.
        </motion.p>

        {/* Feature hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/60 mb-8"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/10 border border-muted/20">
            <Mic size={12} className="text-amber-400" />
            <span>Voice-powered</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/10 border border-muted/20">
            <Target size={12} className="text-red-400" />
            <span>Consistency tracking</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/10 border border-muted/20">
            <Clock size={12} className="text-blue-400" />
            <span>7 exchanges</span>
          </div>
        </motion.div>

        {/* Random case button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <Button
            size="lg"
            onClick={handleRandomCase}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-7 text-lg gap-3 shadow-lg shadow-amber-500/20"
          >
            <Shuffle size={22} />
            Start Random Case
          </Button>
        </motion.div>

        {/* Case selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">
            Or choose a specific case
          </p>
          <div className="grid gap-3">
            {cases.map((caseData, index) => (
              <motion.button
                key={caseData.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                onClick={() => onSelectCase(caseData)}
                className="group w-full text-left p-4 rounded-lg border border-muted/30 bg-muted/5 hover:bg-muted/10 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-amber-400 transition-colors">
                      {caseData.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {caseData.setting}
                    </p>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className="text-muted-foreground/40 group-hover:text-amber-400 transition-colors" 
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Flicker effect */}
      <motion.div
        className="absolute inset-0 bg-white/2 pointer-events-none"
        animate={{ opacity: [0, 0.03, 0, 0.02, 0] }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 8 }}
      />
    </div>
  );
}
