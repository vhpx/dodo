"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import Link from "next/link";
import { useStatsStore, ACHIEVEMENTS_MAP } from "@/lib/stores/stats-store";
import { useCurrencyStore } from "@/lib/stores/currency-store";
import type { AchievementId, ScenarioTheme } from "@/lib/types/game";

const THEME_LABELS: Record<ScenarioTheme, { icon: string; name: string }> = {
  survival: { icon: "🔦", name: "Survival" },
  mystery: { icon: "🔍", name: "Mystery" },
  puzzle: { icon: "🔐", name: "Puzzle" },
  social: { icon: "🎭", name: "Social" },
};

export default function StatsPage() {
  const { stats, unlockedAchievements } = useStatsStore();
  const { coins, streak, highestStreak, totalScenariosCompleted } = useCurrencyStore();

  const winRate = stats.totalGamesPlayed > 0
    ? Math.round((stats.totalWins / stats.totalGamesPlayed) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const achievements = Object.values(ACHIEVEMENTS_MAP);
  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = achievements.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Noir background effects */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, oklch(0.95 0.05 70 / 0.04) 0%, transparent 50%)'
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                ← Return to Cases
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight text-glow-gold">Detective's Record</h1>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Personnel File</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card/80 px-4 py-2 border border-primary/30 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)]">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Funds:</span>
            <span className="font-bold text-primary">{coins}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Case Statistics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SectionHeader title="Case Statistics" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RecordCard
              icon="📋"
              label="Cases Investigated"
              value={stats.totalGamesPlayed}
            />
            <RecordCard
              icon="✓"
              label="Cases Closed"
              value={stats.totalWins}
              variant="success"
            />
            <RecordCard
              icon="📊"
              label="Closure Rate"
              value={`${winRate}%`}
            />
            <RecordCard
              icon="⏱️"
              label="Hours on Duty"
              value={formatTime(stats.totalPlayTime)}
            />
          </div>
        </motion.section>

        {/* Performance Records */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionHeader title="Performance Records" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RecordCard
              icon="🔥"
              label="Active Streak"
              value={streak}
              variant={streak > 0 ? "danger" : "default"}
            />
            <RecordCard
              icon="⚡"
              label="Record Streak"
              value={highestStreak}
            />
            <RecordCard
              icon="⏱️"
              label="Fastest Closure"
              value={stats.fastestWin ? `${Math.floor(stats.fastestWin / 60)}:${(stats.fastestWin % 60).toString().padStart(2, "0")}` : "—"}
            />
            <RecordCard
              icon="📈"
              label="Total Resolved"
              value={totalScenariosCompleted}
            />
          </div>
        </motion.section>

        {/* Specializations (Theme Mastery) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionHeader title="Specializations" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(stats.themeWins) as [ScenarioTheme, number][]).map(
              ([theme, wins]) => {
                const info = THEME_LABELS[theme];
                const progress = Math.min(100, (wins / 5) * 100);
                const isMastered = wins >= 5;
                return (
                  <div
                    key={theme}
                    className={`rounded-lg border p-4 backdrop-blur-sm transition-all ${
                      isMastered
                        ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)]"
                        : "border-primary/20 bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${!isMastered && "grayscale"}`}>{info.icon}</span>
                        <div>
                          <span className="font-medium">{info.name} Cases</span>
                          {isMastered && (
                            <Badge variant="evidence" className="ml-2 text-xs">Specialist</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">
                        {wins}/5
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              }
            )}
          </div>
        </motion.section>

        {/* Commendations (Achievements) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Commendations" className="mb-0" />
            <span className="text-sm font-mono text-muted-foreground">
              {unlockedCount}/{totalAchievements} earned
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id as AchievementId);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`rounded-lg border p-4 transition-all ${
                    isUnlocked
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)]"
                      : "border-primary/10 bg-card/30 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`text-3xl ${!isUnlocked && "grayscale"}`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.description}
                      </div>
                      <div className="text-xs text-primary mt-1 font-mono">
                        +{achievement.reward} bounty
                      </div>
                    </div>
                    {isUnlocked && (
                      <div className="text-primary font-bold">✓</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Field Activity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SectionHeader title="Field Activity" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <RecordCard
              icon="💡"
              label="Clues Examined"
              value={stats.hintsUsed}
            />
            <RecordCard
              icon="🗄️"
              label="Evidence Deployed"
              value={stats.itemsUsed}
            />
            <RecordCard
              icon="❌"
              label="Cold Cases"
              value={stats.totalLosses}
              variant="danger"
            />
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function SectionHeader({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={`mb-4 ${className}`}>
      <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-2" />
    </div>
  );
}

function RecordCard({
  icon,
  label,
  value,
  variant = "default",
}: {
  icon: string;
  label: string;
  value: string | number;
  variant?: "default" | "success" | "danger";
}) {
  const variantStyles = {
    default: "border-primary/20 bg-card/50",
    success: "border-primary/40 bg-primary/5",
    danger: "border-destructive/30 bg-destructive/5",
  };

  const valueStyles = {
    default: "text-foreground",
    success: "text-primary",
    danger: "text-red-400",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`rounded-lg border p-4 backdrop-blur-sm transition-all ${variantStyles[variant]}`}
    >
      <div className="text-2xl mb-2 grayscale opacity-70">{icon}</div>
      <div className={`text-2xl font-bold ${valueStyles[variant]}`}>{value}</div>
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </motion.div>
  );
}
