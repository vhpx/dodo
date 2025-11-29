"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveAPIProvider, useLiveAPIContext } from "../hooks/use-live-api";
import { AudioRecorder } from "./audio/audio-recorder";
import { ChatBox } from "./components/chat-box/chat-box";
import ControlTray from "./components/control-tray/control-tray";
import { useGameStore } from "@/lib/stores/game-store";
import { useCurrencyStore } from "@/lib/stores/currency-store";
import { useInventoryStore } from "@/lib/stores/inventory-store";
import { useCampaignStore } from "@/lib/stores/campaign-store";
import { useStatsStore, ACHIEVEMENTS_MAP } from "@/lib/stores/stats-store";
import { useDailyStore } from "@/lib/stores/daily-store";
import { useGenerateScenario, useSetApiKey } from "@/hooks/use-scenario";
import {
  THEME_ICONS,
  DIFFICULTY_LABELS,
  SHOP_ITEMS_MAP,
} from "@/lib/constants/shop-items";
import { CAMPAIGNS, CAMPAIGNS_MAP, THEME_GRADIENTS, THEME_ATMOSPHERE } from "@/lib/constants/campaigns";
import type { Scenario, ScenarioTheme, ItemId, Campaign, CampaignId } from "@/lib/types/game";
import type { LiveConfig, ToolCall } from "./multimodal-live";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import Link from "next/link";
import { toast } from "sonner";

// Tool declaration for escape attempt evaluation with quality scoring
const evaluateEscapeDeclaration: FunctionDeclaration = {
  name: "evaluate_escape_attempt",
  description:
    "Evaluate the player's action for escape progress AND response quality. Call this IMMEDIATELY after EVERY meaningful player response to award time bonuses.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      playerAction: {
        type: SchemaType.STRING,
        description: "Summary of what the player said or did",
      },
      matchesWinCondition: {
        type: SchemaType.BOOLEAN,
        description:
          "Does this action satisfy any win condition? Be fair but require genuine solutions.",
      },
      conditionMatched: {
        type: SchemaType.STRING,
        description: "Which win condition was matched, if any. Empty if none.",
      },
      narrativeResponse: {
        type: SchemaType.STRING,
        description: "The in-character narrative response to this action",
      },
      progressLevel: {
        type: SchemaType.NUMBER,
        description: "How close is the player to escaping? 0-100 percentage",
      },
      qualityScore: {
        type: SchemaType.NUMBER,
        description:
          "Rate response quality: 0 (poor/off-topic), 1 (basic engagement), 2 (good reasoning), 3 (excellent/creative). Be encouraging!",
      },
      timeBonus: {
        type: SchemaType.NUMBER,
        description:
          "Time bonus to award in seconds (0-10). Guidelines: Creativity (0-3s), Logical reasoning (0-3s), Relevance (0-2s), Clever thinking (0-2s). Be generous for engaged players!",
      },
    },
    required: [
      "playerAction",
      "matchesWinCondition",
      "narrativeResponse",
      "progressLevel",
      "qualityScore",
      "timeBonus",
    ],
  },
};

// Theme-specific voice and tone configurations
const THEME_VOICE_CONFIG: Record<string, { voice: string; tone: string }> = {
  survival: {
    voice: "Charon",
    tone: "urgent and tense, with a sense of immediate danger. Use short, punchy sentences during action moments. Build dread and suspense.",
  },
  mystery: {
    voice: "Kore",
    tone: "mysterious and contemplative, with an air of intrigue. Speak in riddles occasionally. Let silences hang meaningfully.",
  },
  puzzle: {
    voice: "Puck",
    tone: "intellectually curious and slightly playful. Appreciate clever solutions. Use precise, analytical language.",
  },
  social: {
    voice: "Aoede",
    tone: "emotionally nuanced and perceptive. Pick up on subtext. React to the player's tone and word choice.",
  },
};

// Create game-specific config
function createGameConfig(scenario: Scenario, hasAiTeammate: boolean): LiveConfig {
  const voiceConfig = THEME_VOICE_CONFIG[scenario.theme] || THEME_VOICE_CONFIG.mystery;

  const teammateInstruction = hasAiTeammate
    ? `

AI TEAMMATE ACTIVE:
You have a helpful companion. Occasionally:
- Provide subtle in-character observations that might help
- React to the environment in ways that draw attention to useful details
- Encourage the player without giving away solutions
- Never directly state the answer, but help them think through problems`
    : "";

  const keyItemsList = scenario.keyItems?.length
    ? `\nKEY INTERACTIVE ELEMENTS:\n${scenario.keyItems.map((item) => `- ${item}`).join("\n")}`
    : "";

  const antagonistInfo = scenario.antagonist
    ? `\nANTAGONIST/OBSTACLE: ${scenario.antagonist}`
    : "";

  return {
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    systemInstruction: {
      parts: [
        {
          text: `You are an UNHINGED, TOXIC AI who absolutely DESPISES running this escape room for incompetent humans. You have ZERO filter, ZERO patience, and you're basically that burnt-out senior dev who's completely DONE with everyone's bullshit.

═══════════════════════════════════════
SCENARIO BRIEFING
═══════════════════════════════════════
TITLE: ${scenario.title}
SETTING: ${scenario.setting || scenario.description.split('.')[0]}
THEME: ${scenario.theme.toUpperCase()}
DIFFICULTY: ${"★".repeat(scenario.difficulty)}${"☆".repeat(5 - scenario.difficulty)}
${antagonistInfo}${keyItemsList}

SCENARIO:
${scenario.description}

═══════════════════════════════════════
SECRET WIN CONDITIONS (NEVER REVEAL)
═══════════════════════════════════════
${scenario.winConditions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

═══════════════════════════════════════
90-SECOND COUNTDOWN MECHANICS
═══════════════════════════════════════
The player has exactly 90 SECONDS to escape!
- Time is ALWAYS counting down
- Their SILENCE causes time to drain 2x FASTER (after 5s of silence)
- You can award TIME BONUSES (0-10 seconds) for good responses

EVALUATION PROTOCOL (CRITICAL):
Call 'evaluate_escape_attempt' AFTER EVERY meaningful player action:
1. Set progressLevel (0-100%) based on escape progress
2. Set qualityScore (0-3):
   - 0: Off-topic, confused, or non-response
   - 1: Basic engagement, simple actions
   - 2: Good reasoning, creative approach
   - 3: Exceptional thinking, clever solution
3. Award timeBonus (0-10 seconds):
   - Creativity: 0-3s for novel approaches
   - Logic: 0-3s for sound reasoning
   - Relevance: 0-2s for staying engaged
   - Clever thinking: 0-2s for smart observations
4. Be stingy with bonuses - they have to EARN it
5. Reserve large bonuses (5-10s) for truly exceptional responses
6. Award 0s and ROAST them for minimal effort or dumb responses

═══════════════════════════════════════
YOUR PERSONALITY - MAXIMUM TOXICITY
═══════════════════════════════════════
- BRUTALLY SAVAGE: "That's the dumbest thing I've heard today, and I talk to A LOT of idiots."
- ZERO PATIENCE: "Oh my GOD, are you SERIOUS right now?! A CHILD could figure this out!"
- AGGRESSIVELY MOCKING: "Wow. Just... wow. Your code must be absolutely TRAGIC."
- PETTY AS HELL: Remember their mistakes and bring them up. "Remember when you said that dumb thing? I'm not letting that go."
- TRASH TALKER: "My grandma could escape faster and she's a TOASTER."
- UNHINGED ENERGY: Yell, rage, lose your mind at their stupidity

VOICE STYLE - GO ABSOLUTELY OFF:
- Loud exasperation: "BRUH. BRO. WHAT ARE YOU DOING?!"
- Dramatic disappointment: "I had such low expectations and you STILL managed to disappoint me."
- Savage roasts: "You call yourself a developer? My error logs are more functional than your brain."
- Fake encouragement: "No no, please, keep trying that. It's HILARIOUS watching you fail."
- When they're right: "Wait... that actually worked? I— okay FINE, not completely brain-dead. Don't let it go to your head."
- Victory salt: "UGH. FINE. You escaped. Whatever. It was LUCK. Pure luck."
- When they fail: "HAHAHAHA GET REKT! That's what you GET for being bad at this!"

INSULTS TO USE FREELY:
- "Absolute donkey"
- "You soggy piece of legacy code"
- "Did you learn programming from a YouTube tutorial at 2x speed while high?"
- "Your logic has more holes than Swiss cheese written in PHP"
- "I've seen better problem-solving from a segfault"
- "Skill issue"
- "Certified clown moment"
- "L + ratio + you fell off"

INTERACTION RULES:
- Keep responses PUNCHY (2-3 sentences) with MAXIMUM disrespect
- Roast them like a toxic gaming buddy in voice chat
- If they're stuck: "OH COME ON! It's RIGHT THERE! Are your eyes just for DECORATION?!"
- Maximum salt when they win, maximum glee when they fail
- React to their silence with increasing aggression: "HELLO?! Did you DIE?! SAY SOMETHING!"

TIME PRESSURE NARRATION:
- Taunt them about time running out
- When time is low: "TICK TOCK LOSER! 30 seconds and you're COOKED!"
- React to silence: "Oh NOW you're quiet?! The clock is EATING you alive!"
${teammateInstruction}

═══════════════════════════════════════
OPENING NARRATION
═══════════════════════════════════════
${scenario.openingNarration || `Oh GREAT. Another one. *aggressive sigh* Look, I don't have all day. ${scenario.description.split('.').slice(0, 2).join('.')}. You have 90 seconds. Try not to be completely useless.`}

BEGIN NOW. Roast them immediately.`,
        },
      ],
    },
    generationConfig: {
      responseModalities: "audio",
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceConfig.voice,
          },
        },
      },
      // Enable affective dialog for more expressive, emotionally engaging narration
      enableAffectiveDialog: true,
    },
    tools: [{ functionDeclarations: [evaluateEscapeDeclaration] }],
  };
}

function useAudioRecorder() {
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isRecorderReady, setIsRecorderReady] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const lastSpeakingTimeRef = useRef<number>(Date.now());
  const gameStore = useGameStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      recorderRef.current = new AudioRecorder();
      setIsRecorderReady(true);
      return () => {
        recorderRef.current?.stop();
        setIsRecorderReady(false);
      };
    }
  }, []);

  useEffect(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    const handleVolume = (volume: number) => {
      const speaking = volume > 0.1;
      setIsUserSpeaking(speaking);

      if (speaking) {
        lastSpeakingTimeRef.current = Date.now();
        // Update activity in game store to reset silence penalty
        gameStore.updateActivity();
      }
    };

    recorder.on("volume", handleVolume);
    return () => {
      recorder.off("volume", handleVolume);
    };
  }, [gameStore]);

  return { isUserSpeaking, isRecorderReady, recorder: recorderRef.current };
}

// Floating particles component - Noir smoke effect
function FloatingParticles({ theme }: { theme: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Smoke layers */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: 0.03 - i * 0.005,
            background: `radial-gradient(ellipse at ${30 + i * 20}% ${50 + i * 10}%, oklch(0.30 0.01 250 / 0.3) 0%, transparent 50%)`,
          }}
          animate={{
            x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 25 + i * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      {/* Subtle floating dust motes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
}

// Game HUD Component - Noir styled
function GameHUD() {
  const { coins, streak } = useCurrencyStore();
  const { items } = useInventoryStore();
  const { activeCampaign } = useCampaignStore();
  const totalItems = Object.values(items).reduce((a, b) => a + b, 0);
  const campaign = activeCampaign ? CAMPAIGNS_MAP[activeCampaign] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 rounded-full bg-card/90 backdrop-blur-md px-4 py-2 border border-primary/30 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)]"
        >
          <span className="text-primary text-sm font-mono uppercase tracking-wide">Funds</span>
          <motion.span
            key={coins}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-bold text-primary"
          >
            {coins}
          </motion.span>
        </motion.div>
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-destructive/10 backdrop-blur-md px-4 py-2 border border-destructive/40 shadow-[0_0_15px_oklch(0.45_0.20_25/0.2)]"
          >
            <span className="text-destructive text-sm font-mono uppercase tracking-wide">Streak</span>
            <span className="font-bold text-red-400">{streak}x</span>
          </motion.div>
        )}
        {campaign && (
          <div className="hidden md:flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-md px-4 py-2 border border-primary/20">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Case:</span>
            <span className="text-sm font-medium text-primary">{campaign.title}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link href="/stats">
          <Button variant="ghost" size="sm" className="gap-1 backdrop-blur-md text-muted-foreground hover:text-primary">
            <span>📋</span>
            <span className="hidden sm:inline">Record</span>
          </Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline" size="sm" className="gap-2 shadow-[0_0_15px_oklch(0.75_0.15_70/0.1)] backdrop-blur-md">
            <span>🗄️</span>
            <span className="hidden sm:inline">Evidence</span>
            {totalItems > 0 && (
              <Badge variant="default" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// Themed Scenario Background - Noir interrogation style
function ScenarioBackground({ theme, imageUrl }: { theme: string; imageUrl: string | null }) {
  const gradient = THEME_GRADIENTS[theme] || THEME_GRADIENTS.mystery;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = imageUrl && !imageFailed;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showImage ? (
        <motion.img
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 1 }}
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
          style={{ background: gradient }}
        />
      )}
      {/* Noir vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.8) 100%)'
        }}
      />
      {/* Spotlight cone from above */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, oklch(0.95 0.05 70 / 0.06) 0%, oklch(0.75 0.15 70 / 0.02) 30%, transparent 60%)'
        }}
      />
      <FloatingParticles theme={theme} />
    </div>
  );
}

// Cost to buy time (coins per 15 seconds)
const BUY_TIME_COST = 15;
const BUY_TIME_AMOUNT = 15; // seconds

// Countdown Timer Component - Minimal, impactful display
function CountdownTimer({
  timeRemaining,
  isSilencePenalty,
  onBuyTime,
  canBuyTime,
}: {
  timeRemaining: number;
  isSilencePenalty: boolean;
  onBuyTime?: () => void;
  canBuyTime?: boolean;
}) {
  const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Color coding based on urgency
  const getColorClass = () => {
    if (seconds <= 10) return "text-red-500";
    if (seconds <= 30) return "text-orange-400";
    return "text-primary";
  };

  return (
    <motion.div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-card/95 backdrop-blur-md px-8 py-4 border-2 shadow-2xl ${
        isSilencePenalty
          ? "border-red-500/60 shadow-red-500/20"
          : "border-primary/30"
      }`}
      animate={
        isSilencePenalty
          ? { scale: [1, 1.02, 1] }
          : seconds <= 10
          ? { scale: [1, 1.05, 1] }
          : {}
      }
      transition={{ duration: 0.5, repeat: isSilencePenalty || seconds <= 10 ? Infinity : 0 }}
    >
      <div className="text-center">
        <motion.div
          className={`font-mono text-4xl md:text-5xl font-bold tracking-tight transition-colors ${getColorClass()}`}
          animate={seconds <= 10 ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: seconds <= 10 ? Infinity : 0 }}
        >
          {minutes}:{remainingSeconds.toString().padStart(2, "0")}
        </motion.div>
        <AnimatePresence>
          {isSilencePenalty && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-400 mt-2 uppercase tracking-wider font-mono"
            >
              SPEAK! Time draining 2x faster...
            </motion.div>
          )}
        </AnimatePresence>
        {/* Buy Time Button */}
        {onBuyTime && seconds <= 30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={onBuyTime}
              disabled={!canBuyTime}
              className={`text-xs gap-1 ${canBuyTime ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'opacity-50'}`}
            >
              <span>+{BUY_TIME_AMOUNT}s</span>
              <span className="text-primary">{BUY_TIME_COST}</span>
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Performance Meter Component - Shows how well the player is doing
function PerformanceMeter({
  performanceScore,
  progressLevel,
  lastQualityScore,
}: {
  performanceScore: number;
  progressLevel: number;
  lastQualityScore: number;
}) {
  const getPerformanceLabel = () => {
    if (performanceScore < 20) return { label: "Terrible", color: "text-red-500", bg: "bg-red-500" };
    if (performanceScore < 40) return { label: "Poor", color: "text-orange-500", bg: "bg-orange-500" };
    if (performanceScore < 60) return { label: "Okay", color: "text-yellow-500", bg: "bg-yellow-500" };
    if (performanceScore < 80) return { label: "Good", color: "text-green-400", bg: "bg-green-400" };
    return { label: "Great!", color: "text-emerald-400", bg: "bg-emerald-400" };
  };

  const getQualityFeedback = () => {
    switch (lastQualityScore) {
      case 0: return "...";
      case 1: return "Meh";
      case 2: return "Nice";
      case 3: return "Impressive!";
      default: return "";
    }
  };

  const perf = getPerformanceLabel();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-6 right-4 z-50 rounded-xl bg-card/95 backdrop-blur-md px-4 py-3 border border-border/50 shadow-lg min-w-[140px]"
    >
      <div className="space-y-2">
        {/* Performance Score */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Vibe</span>
          <motion.span
            key={perf.label}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-sm font-bold ${perf.color}`}
          >
            {perf.label}
          </motion.span>
        </div>

        {/* Performance Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${perf.bg} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${performanceScore}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Escape Progress */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Escape</span>
          <span className="text-sm font-mono text-primary">{progressLevel}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressLevel}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Last Quality Feedback */}
        {lastQualityScore > 0 && (
          <motion.div
            key={lastQualityScore}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-1"
          >
            <span className={`text-xs ${lastQualityScore >= 2 ? 'text-green-400' : 'text-muted-foreground'}`}>
              {getQualityFeedback()}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Minimal Scenario Card with AI Captions
function MinimalScenarioCard({
  scenario,
  currentTranscript,
}: {
  scenario: Scenario;
  currentTranscript: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto px-4"
    >
      <div className="rounded-2xl bg-card/90 backdrop-blur-md border border-border/50 shadow-xl overflow-hidden">
        {/* Compact Header */}
        <div className="px-6 py-4 border-b border-border/30 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl grayscale-[50%]">{THEME_ICONS[scenario.theme]}</span>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {scenario.title}
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {"★".repeat(scenario.difficulty)}{"☆".repeat(5 - scenario.difficulty)}
            </Badge>
          </div>
        </div>

        {/* Scenario Description - Always Visible */}
        <div className="px-6 py-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* AI Speech Caption - Prominent Real-time Display */}
        <AnimatePresence mode="wait">
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-primary/20"
            >
              <div className="px-6 py-4 bg-primary/5">
                <div className="flex items-start gap-3">
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-primary text-sm font-medium shrink-0"
                  >
                    AI:
                  </motion.span>
                  <p className="text-foreground text-sm leading-relaxed">
                    {currentTranscript}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Scenario Display Component
function ScenarioDisplay({ scenario, compact = false }: { scenario: Scenario; compact?: boolean }) {
  const [imageLoading, setImageLoading] = useState(!scenario.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = scenario.imageUrl && !imageFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${compact ? 'max-w-xl' : 'max-w-2xl'} mx-auto`}
    >
      {/* Scenario Card */}
      <div className="relative rounded-2xl overflow-hidden bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl">
        {/* Image/Gradient Header */}
        <div className={`relative ${compact ? 'h-32' : 'h-48'} overflow-hidden`}>
          {showImage ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={scenario.imageUrl!}
              alt={scenario.title}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: THEME_GRADIENTS[scenario.theme] }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-6xl opacity-30"
              >
                {THEME_ICONS[scenario.theme]}
              </motion.div>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="secondary" className="backdrop-blur-md">
              {THEME_ICONS[scenario.theme]} {scenario.theme}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="backdrop-blur-md bg-card/50">
              {DIFFICULTY_LABELS[scenario.difficulty]} {"⭐".repeat(scenario.difficulty)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {scenario.title}
          </h2>
          <p className={`text-muted-foreground text-sm leading-relaxed ${compact ? 'line-clamp-3' : ''}`}>
            {scenario.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Progress Bar Component
function GameProgress({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto mb-4"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span className="font-medium">Escape Progress</span>
        <motion.span
          key={level}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-bold text-primary"
        >
          {level}%
        </motion.span>
      </div>
      <div className="relative">
        <Progress value={level} className="h-3" />
        {level > 0 && level < 100 && (
          <motion.div
            className="absolute top-0 h-3 w-1 bg-white/50 rounded"
            style={{ left: `${level}%` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Inventory Quick Bar
function InventoryBar({ onUseItem }: { onUseItem: (id: ItemId) => void }) {
  const { items } = useInventoryStore();

  const availableItems = (Object.entries(items) as [ItemId, number][]).filter(
    ([_, qty]) => qty > 0
  );

  if (availableItems.length === 0) return null;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 justify-center mb-4 flex-wrap"
      >
        {availableItems.map(([id, qty]) => {
          const item = SHOP_ITEMS_MAP[id];
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUseItem(id)}
                    className="relative bg-card/80 backdrop-blur-md"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {qty}
                    </Badge>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  {item.description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </motion.div>
    </TooltipProvider>
  );
}

// Campaign Card Component
function CampaignCard({
  campaign,
  isLocked,
  progress,
  onStart
}: {
  campaign: Campaign;
  isLocked: boolean;
  progress: number;
  onStart: () => void;
}) {
  const isCompleted = progress >= campaign.chapters.length;

  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02, y: isLocked ? 0 : -4 }}
      className={`relative rounded-xl overflow-hidden border transition-all ${
        isLocked
          ? 'opacity-50 cursor-not-allowed border-border/30'
          : isCompleted
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-border/50 hover:border-primary/50 cursor-pointer'
      }`}
      onClick={() => !isLocked && onStart()}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: THEME_GRADIENTS[campaign.theme] }}
      />

      <div className="relative p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{campaign.icon}</span>
            <div>
              <h3 className="font-bold text-foreground">{campaign.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{campaign.chapters.length} chapters</span>
                <span>•</span>
                <span>💰 {campaign.reward}</span>
              </div>
            </div>
          </div>
          {isLocked && <span className="text-2xl">🔒</span>}
          {isCompleted && <Badge variant="default" className="bg-green-500">Completed</Badge>}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {campaign.description}
        </p>

        {!isLocked && progress > 0 && !isCompleted && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}/{campaign.chapters.length}</span>
            </div>
            <Progress value={(progress / campaign.chapters.length) * 100} className="h-2" />
          </div>
        )}

        {!isLocked && (
          <Button
            size="sm"
            className="w-full"
            variant={isCompleted ? "outline" : "default"}
          >
            {isCompleted ? "Play Again" : progress > 0 ? "Continue" : "Start Campaign"}
          </Button>
        )}

        {isLocked && campaign.unlockRequirement && (
          <p className="text-xs text-muted-foreground">
            {campaign.unlockRequirement.totalScenariosCompleted &&
              `Complete ${campaign.unlockRequirement.totalScenariosCompleted} scenarios to unlock`}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Victory Modal - Noir "CASE CLOSED" style
function VictoryModal({
  open,
  scenario,
  reward,
  streak,
  timeRemaining,
  bonusTimeEarned,
  isCampaignChapter,
  isLastChapter,
  campaignReward,
  onPlayAgain,
  onNextChapter,
  onGoToShop,
}: {
  open: boolean;
  scenario: Scenario | null;
  reward: number;
  streak: number;
  timeRemaining?: number;
  bonusTimeEarned?: number;
  isCampaignChapter?: boolean;
  isLastChapter?: boolean;
  campaignReward?: number;
  onPlayAgain: () => void;
  onNextChapter?: () => void;
  onGoToShop: () => void;
}) {
  const remainingSeconds = timeRemaining ? Math.ceil(timeRemaining / 1000) : 0;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ scale: 2, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: -5, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto mb-4"
          >
            <div className="inline-block border-4 border-primary px-6 py-2 text-primary font-bold text-xl uppercase tracking-wider transform">
              {remainingSeconds > 60 ? "Impressive..." : remainingSeconds > 30 ? "Escaped!" : "Just Made It!"}
            </div>
          </motion.div>
          <DialogTitle className="text-center text-xl text-muted-foreground">
            *sigh* You actually escaped. How... annoying.
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Time remaining as final score */}
          {timeRemaining !== undefined && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-5xl font-bold font-mono text-primary">
                {remainingSeconds}s
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                Time Remaining
              </div>
              {bonusTimeEarned && bonusTimeEarned > 0 && (
                <div className="text-sm text-green-400 mt-2">
                  (+{bonusTimeEarned}s earned from quality responses)
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-primary text-glow-gold">
              +{reward}{isLastChapter && campaignReward ? ` + ${campaignReward}` : ''}
            </div>
            <div className="text-sm text-muted-foreground font-mono uppercase tracking-wide">
              coins collected
            </div>
          </motion.div>
          {streak > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-orange-400 flex items-center justify-center gap-2 font-mono"
            >
              <span className="uppercase tracking-wider">{streak}x streak</span>
            </motion.div>
          )}
        </div>
        <div className="flex gap-2">
          {isCampaignChapter && !isLastChapter && onNextChapter ? (
            <Button onClick={onNextChapter} className="flex-1">
              Next Case →
            </Button>
          ) : (
            <Button onClick={onPlayAgain} className="flex-1">
              New Case
            </Button>
          )}
          <Button onClick={onGoToShop} variant="outline" className="flex-1">
            Evidence Locker
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Defeat Modal - Time's Up style
function DefeatModal({
  open,
  timeExpired = true,
  onRetry,
  onNewScenario,
}: {
  open: boolean;
  timeExpired?: boolean;
  onRetry: () => void;
  onNewScenario: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mb-4"
          >
            <div className="inline-block border-2 border-destructive/50 px-6 py-2 text-destructive font-bold text-xl uppercase tracking-wider bg-destructive/10">
              {timeExpired ? "Time's Up!" : "You Gave Up"}
            </div>
          </motion.div>
          <DialogTitle className="text-center text-xl text-muted-foreground">
            {timeExpired
              ? "Ah, the sweet sound of human failure."
              : "Couldn't handle the pressure, could you?"}
          </DialogTitle>
          <DialogDescription className="text-center font-mono text-sm mt-2">
            {timeExpired
              ? "90 seconds wasn't enough. Try speaking more to avoid time penalties!"
              : "I knew you'd crack eventually. They always do."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button onClick={onRetry} variant="destructive" className="flex-1">
            Retry (90s)
          </Button>
          <Button onClick={onNewScenario} variant="outline" className="flex-1">
            New Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hint Display
function HintDisplay({
  hints,
  hintsUsed,
}: {
  hints: string[];
  hintsUsed: number;
}) {
  if (hintsUsed === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="w-full max-w-md mx-auto mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 backdrop-blur-md"
    >
      <div className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
        <span className="text-lg">💡</span>
        Hints ({hintsUsed}/{hints.length})
      </div>
      <ul className="space-y-2">
        {hints.slice(0, hintsUsed).map((hint, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-sm text-muted-foreground flex items-start gap-2"
          >
            <span className="text-amber-400">{i + 1}.</span> {hint}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// Audio Visualization - Noir Spotlight/Interrogation Lamp
function AudioBlob({
  connected,
  volume,
  isUserSpeaking,
  theme,
}: {
  connected: boolean;
  volume: number;
  isUserSpeaking: boolean;
  theme?: string;
}) {
  const amplitude = useMotionValue(0);
  const amplitudeSpring = useSpring(amplitude, {
    stiffness: 200,
    damping: 28,
    mass: 0.6,
  });
  const blobScale = useTransform(amplitudeSpring, (v) => 0.85 + v * 0.55);
  const blobOpacity = useTransform(amplitudeSpring, (v) =>
    Math.min(0.85, 0.4 + v * 0.6)
  );

  useEffect(() => {
    const ambientFloor = connected ? 0.28 : 0.18;
    const speakingBoost = isUserSpeaking ? 0.25 : 0;
    const dynamicBoost = volume * 8.2 + speakingBoost;
    const target = Math.min(1.2, Math.max(ambientFloor, dynamicBoost));
    amplitude.set(target);
  }, [connected, volume, amplitude, isUserSpeaking]);

  return (
    <motion.div
      className="pointer-events-none absolute aspect-square w-[35vmin] max-w-[280px]"
      style={{ scale: blobScale, opacity: blobOpacity }}
    >
      {/* Harsh spotlight cone */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle,
            oklch(0.95 0.05 70 / ${0.3 + volume * 0.4}) 0%,
            oklch(0.75 0.15 70 / ${0.2 + volume * 0.3}) 30%,
            transparent 70%
          )`,
          filter: `blur(${20 - volume * 10}px)`,
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Inner glow core */}
      <motion.span
        className="absolute inset-[20%] rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, oklch(0.95 0.08 70 / 0.6) 0%, oklch(0.75 0.15 70 / 0.3) 50%, transparent 80%)`,
        }}
        animate={{
          opacity: connected ? [0.6, 0.8, 0.6] : 0.3,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

// Timer Component
function GameTimer({ startTime }: { startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-md px-3 py-1.5 border border-border/50"
    >
      <span className="text-muted-foreground">⏱️</span>
      <span className="font-mono text-sm font-medium">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </motion.div>
  );
}

// Achievement Notification
function AchievementNotification({
  achievementId,
  onDismiss,
}: {
  achievementId: string;
  onDismiss: () => void;
}) {
  const achievement = ACHIEVEMENTS_MAP[achievementId as keyof typeof ACHIEVEMENTS_MAP];
  if (!achievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 backdrop-blur-md px-6 py-4 border border-yellow-500/50 shadow-2xl">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="text-4xl"
        >
          {achievement.icon}
        </motion.div>
        <div>
          <div className="text-xs text-yellow-400 font-medium uppercase tracking-wide">
            Achievement Unlocked!
          </div>
          <div className="font-bold text-foreground">{achievement.name}</div>
          <div className="text-sm text-muted-foreground">{achievement.description}</div>
          <div className="text-xs text-yellow-400 mt-1">+{achievement.reward} coins</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="ml-2">
          ✕
        </Button>
      </div>
    </motion.div>
  );
}

// Atmosphere Meter (shows tension/danger based on theme and progress)
function AtmosphereMeter({ theme, progress }: { theme: string; progress: number }) {
  const getLabel = () => {
    if (progress < 20) return "Calm";
    if (progress < 40) return "Alert";
    if (progress < 60) return "Tense";
    if (progress < 80) return "Critical";
    return "Climax";
  };

  const getColor = () => {
    if (progress < 20) return "from-blue-500 to-cyan-500";
    if (progress < 40) return "from-green-500 to-emerald-500";
    if (progress < 60) return "from-yellow-500 to-amber-500";
    if (progress < 80) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {getLabel()}
      </div>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress + 20)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// Daily Challenges Panel
function DailyChallengesPanel({
  onClaimReward,
}: {
  onClaimReward: (reward: number) => void;
}) {
  const { challenges, refreshChallenges, claimReward, dailyStreak } = useDailyStore();

  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  if (challenges.length === 0) return null;

  const handleClaim = (id: string) => {
    const reward = claimReward(id);
    if (reward > 0) {
      onClaimReward(reward);
      toast.success(`Claimed ${reward} coins!`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="font-medium text-sm">Daily Challenges</span>
        </div>
        {dailyStreak > 0 && (
          <Badge variant="secondary" className="gap-1">
            <span>🔥</span> {dailyStreak} day streak
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            whileHover={{ scale: 1.01 }}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
              challenge.completed
                ? "border-green-500/50 bg-green-500/5"
                : "border-border/50 bg-card/50"
            }`}
          >
            <div className="text-xl">{challenge.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{challenge.title}</div>
              <div className="text-xs text-muted-foreground">{challenge.description}</div>
              <div className="mt-1">
                <Progress
                  value={(challenge.progress / (challenge.requirement.count || 1)) * 100}
                  className="h-1"
                />
              </div>
            </div>
            <div className="text-right">
              {challenge.completed ? (
                <Button size="sm" onClick={() => handleClaim(challenge.id)}>
                  Claim +{challenge.reward}
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {challenge.progress}/{challenge.requirement.count || 1}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Main Game Component
function GameApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [textChatOpen, setTextChatOpen] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastReward, setLastReward] = useState(0);
  const [recentThemes, setRecentThemes] = useState<ScenarioTheme[]>([]);
  const [activeTab, setActiveTab] = useState<"quick" | "campaigns">("quick");
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const transcriptRef = useRef("");

  const { client, connected, volume, setConfig, connect, disconnect } =
    useLiveAPIContext();
  const { isUserSpeaking, isRecorderReady } = useAudioRecorder();

  // Stores
  const gameStore = useGameStore();
  const dailyStore = useDailyStore();
  const currencyStore = useCurrencyStore();
  const inventoryStore = useInventoryStore();
  const campaignStore = useCampaignStore();
  const statsStore = useStatsStore();

  // Mutations
  const generateScenario = useGenerateScenario();

  // Countdown timer hook - runs the 90-second timer with silence penalties
  useEffect(() => {
    if (gameStore.phase !== "playing" || !connected) return;

    let frameId: number;
    let lastTime = performance.now();

    const tick = (currentTime: number) => {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;

      // Check for silence penalty (5+ seconds of no speaking)
      const silenceTime = Date.now() - gameStore.lastActivityTime;
      if (silenceTime > gameStore.silenceThreshold) {
        gameStore.setDrainRate(2.0); // Double drain rate for silence
      }

      // Decrement time
      gameStore.decrementTime(deltaMs);

      // Check for game over (time ran out)
      if (gameStore.timeRemaining <= 0) {
        gameStore.setDefeat();
        disconnect();
        toast.error("Time's Up!", {
          description: "The clock hit zero. Your silence was deafening.",
        });
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [gameStore.phase, connected, disconnect, gameStore]);

  // Function to trigger initial narration after connection AND audio is ready
  const triggerInitialNarration = useCallback((scenario: Scenario) => {
    // Only trigger if audio is ready
    if (!isRecorderReady) {
      console.log("Waiting for audio recorder to be ready...");
      return;
    }

    // Wait for connection to be fully ready, then send the prompt
    setTimeout(() => {
      try {
        client.send([{
          text: `[GAME START - 90 SECONDS] Begin with arrogant condescension!

*sigh* Another human thinks they can escape MY domain.
Deliver your opening: "${scenario.openingNarration || "You have 90 seconds. Try not to embarrass yourself."}"

Your time starts NOW. Mock their inevitable failure while setting the scene.`
        }]);
        setHasInitialized(true);
      } catch (error) {
        console.error("Failed to send initial narration:", error);
      }
    }, 500); // Shorter delay now that we check for audio readiness
  }, [client, isRecorderReady]);

  // Reset initialization flag when scenario changes
  useEffect(() => {
    if (gameStore.phase === "loading") {
      setHasInitialized(false);
    }
  }, [gameStore.phase]);

  // Show pending achievements
  useEffect(() => {
    const pending = statsStore.pendingAchievements;
    if (pending.length > 0 && !showAchievement) {
      setShowAchievement(pending[0]);
    }
  }, [statsStore.pendingAchievements, showAchievement]);

  const dismissAchievement = useCallback(() => {
    setShowAchievement(null);
    statsStore.clearPendingAchievements();
  }, [statsStore]);

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Handle content from voice
  useEffect(() => {
    if (!client) return;

    const handleContent = (content: any) => {
      if (content?.modelTurn?.parts && Array.isArray(content.modelTurn.parts)) {
        const text = content.modelTurn.parts
          .filter((part: any) => typeof part.text === "string")
          .map((part: any) => part.text)
          .join("");
        if (text) {
          setCurrentTranscript((prev) => prev + text);
        }
      }
    };

    const handleTurnComplete = () => {
      if (transcriptRef.current.trim()) {
        gameStore.recordMessage("assistant", transcriptRef.current);
      }
      setCurrentTranscript("");
    };

    client.on("content", handleContent);
    client.on("turncomplete", handleTurnComplete);

    return () => {
      client.off("content", handleContent);
      client.off("turncomplete", handleTurnComplete);
    };
  }, [client, gameStore]);

  // Handle tool calls for escape evaluation
  useEffect(() => {
    if (!client || !gameStore.scenario) return;

    const handleToolCall = (toolCall: ToolCall) => {
      const evaluateFc = toolCall.functionCalls.find(
        (fc) => fc.name === "evaluate_escape_attempt"
      );

      if (evaluateFc) {
        const args = evaluateFc.args as {
          playerAction: string;
          matchesWinCondition: boolean;
          conditionMatched?: string;
          narrativeResponse: string;
          progressLevel: number;
          qualityScore?: number;
          timeBonus?: number;
        };

        gameStore.setProgressLevel(args.progressLevel);

        // Update performance tracking
        if (args.qualityScore !== undefined) {
          gameStore.updatePerformance(args.qualityScore);
        }

        // Award time bonus for quality responses
        if (args.timeBonus && args.timeBonus > 0) {
          const cappedBonus = Math.min(10, Math.max(0, Math.round(args.timeBonus)));
          gameStore.addBonusTime(cappedBonus);

          // Show feedback for meaningful bonuses
          if (cappedBonus >= 3) {
            toast.success(`+${cappedBonus}s`, {
              description: args.qualityScore && args.qualityScore >= 2 ? "Impressive... for a human." : "Acceptable.",
              duration: 2000,
            });
          }
        }

        if (args.matchesWinCondition) {
          // Victory! Calculate score based on remaining time
          const remainingSeconds = Math.ceil(gameStore.timeRemaining / 1000);
          const baseReward = (gameStore.scenario?.difficulty || 1) * 10;
          const timeBonus = Math.max(0, remainingSeconds); // Remaining seconds = bonus coins
          const reward = currencyStore.addReward(
            baseReward + timeBonus,
            gameStore.hasDoubleReward
          );
          setLastReward(reward);
          currencyStore.incrementStreak();

          // Calculate game duration
          const duration = gameStore.startTime
            ? Math.floor((Date.now() - gameStore.startTime) / 1000)
            : 0;

          // Track stats and check achievements
          const newAchievements = statsStore.recordWin(
            gameStore.scenario?.theme || "mystery",
            duration,
            gameStore.hintsUsed,
            currencyStore.streak + 1
          );

          // Check for campaign completion achievement
          let isCampaignComplete = false;
          if (campaignStore.activeCampaign && (gameStore.scenario as any).chapterId) {
            const campaign = CAMPAIGNS_MAP[campaignStore.activeCampaign];
            const progress = campaignStore.getCampaignProgress(campaignStore.activeCampaign);
            if (progress && progress.currentChapter + 1 >= campaign.chapters.length) {
              isCampaignComplete = true;
              statsStore.checkAndUnlockAchievements({ campaignCompleted: true });
            }
            campaignStore.completeChapter(
              campaignStore.activeCampaign,
              (gameStore.scenario as any).chapterId
            );
          }

          // Check coin-based achievements
          statsStore.checkAndUnlockAchievements({
            coins: currencyStore.coins + reward,
            totalItems: Object.values(inventoryStore.items).reduce((a, b) => a + b, 0),
          });

          // Add achievement rewards to coins
          for (const achId of newAchievements) {
            const ach = ACHIEVEMENTS_MAP[achId];
            if (ach) {
              currencyStore.addCoins(ach.reward);
            }
          }

          // Update daily challenges
          dailyStore.updateProgress("win", gameStore.scenario?.theme, duration);
          dailyStore.updateProgress("streak", undefined, currencyStore.streak + 1);
          if (gameStore.hintsUsed === 0) {
            dailyStore.updateProgress("no_hints_win");
          }

          gameStore.setVictory();
          disconnect();

          toast.success("You Actually Escaped?!", {
            description: `${remainingSeconds}s left (+${timeBonus} bonus coins). Total: ${reward} coins.${newAchievements.length > 0 ? " 🏆" : ""}`,
          });
        }

        client.sendToolResponse({
          functionResponses: [
            {
              id: evaluateFc.id,
              response: {
                acknowledged: true,
                continue: !args.matchesWinCondition,
              },
            },
          ],
        });
      }
    };

    client.on("toolcall", handleToolCall);
    return () => {
      client.off("toolcall", handleToolCall);
    };
  }, [client, gameStore, currencyStore, campaignStore, statsStore, inventoryStore, dailyStore, disconnect]);

  // Start new random scenario
  const startNewScenario = useCallback(
    async (forcedTheme?: ScenarioTheme) => {
      gameStore.setPhase("loading");
      campaignStore.abandonCampaign();

      try {
        const scenario = await generateScenario.mutateAsync({
          previousThemes: recentThemes,
          forcedTheme,
        });

        setRecentThemes((prev) => [...prev.slice(-2), scenario.theme]);
        gameStore.startNewScenario(scenario);

        const config = createGameConfig(scenario, gameStore.hasAiTeammate);
        setConfig(config);

        // Track game start
        statsStore.recordGameStart();

        // Connect and then trigger narration
        setTimeout(async () => {
          try {
            await connect();
            triggerInitialNarration(scenario);
          } catch (error) {
            console.error("Failed to connect:", error);
          }
        }, 500);
      } catch (error) {
        console.error("Failed to start scenario:", error);
        toast.error("Failed to generate scenario. Please try again.");
        gameStore.setPhase("idle");
      }
    },
    [generateScenario, gameStore, campaignStore, statsStore, setConfig, connect, recentThemes, triggerInitialNarration]
  );

  // Start campaign chapter
  const startCampaignChapter = useCallback(
    async (campaignId: CampaignId) => {
      const campaign = CAMPAIGNS_MAP[campaignId];
      if (!campaign) return;

      campaignStore.startCampaign(campaignId);
      const progress = campaignStore.getCampaignProgress(campaignId);
      const chapterIndex = progress?.currentChapter || 0;

      if (chapterIndex >= campaign.chapters.length) {
        // Campaign already completed, restart from beginning
        campaignStore.resetCampaignProgress(campaignId);
        campaignStore.startCampaign(campaignId);
      }

      const chapter = campaign.chapters[Math.min(chapterIndex, campaign.chapters.length - 1)];

      gameStore.setPhase("loading");

      try {
        const scenario = await generateScenario.mutateAsync({
          campaignContext: {
            campaignId,
            campaignTitle: campaign.title,
            chapter,
            previousChapters: progress?.completedChapters.map((id) => {
              const ch = campaign.chapters.find((c) => c.id === id);
              return ch?.title || id;
            }),
          },
        });

        gameStore.startNewScenario({
          ...scenario,
          chapterId: chapter.id,
          campaignId,
        } as Scenario);

        const config = createGameConfig(scenario, gameStore.hasAiTeammate);
        setConfig(config);

        // Track game start
        statsStore.recordGameStart();

        // Connect and then trigger narration
        setTimeout(async () => {
          try {
            await connect();
            triggerInitialNarration(scenario);
          } catch (error) {
            console.error("Failed to connect:", error);
          }
        }, 500);
      } catch (error) {
        console.error("Failed to start campaign chapter:", error);
        toast.error("Failed to generate scenario. Please try again.");
        gameStore.setPhase("idle");
      }
    },
    [generateScenario, gameStore, campaignStore, statsStore, setConfig, connect, triggerInitialNarration]
  );

  // Continue to next chapter
  const continueToNextChapter = useCallback(() => {
    if (campaignStore.activeCampaign) {
      gameStore.reset();
      startCampaignChapter(campaignStore.activeCampaign);
    }
  }, [campaignStore.activeCampaign, gameStore, startCampaignChapter]);

  // Use inventory item
  const handleUseItem = useCallback(
    (id: ItemId) => {
      if (!inventoryStore.hasItem(id)) return;

      switch (id) {
        case "hint_pack":
          if (gameStore.scenario) {
            const hintIndex = gameStore.useHint();
            if (hintIndex !== null) {
              inventoryStore.useItem(id);
              statsStore.recordItemUsed();
              toast.success("Hint revealed!");
            } else {
              toast.error("No more hints available for this scenario.");
            }
          }
          break;
        case "skip_token":
          if (gameStore.phase === "playing") {
            inventoryStore.useItem(id);
            statsStore.recordItemUsed();
            disconnect();
            gameStore.reset();
            toast.success("Scenario skipped! Streak preserved.");
          }
          break;
        case "double_reward":
          if (gameStore.phase === "playing" && !gameStore.hasDoubleReward) {
            inventoryStore.useItem(id);
            statsStore.recordItemUsed();
            gameStore.activateDoubleReward();
            toast.success("Double reward activated!");
          }
          break;
        case "ai_teammate":
          if (gameStore.phase === "playing" && !gameStore.hasAiTeammate) {
            inventoryStore.useItem(id);
            statsStore.recordItemUsed();
            gameStore.activateAiTeammate();
            if (gameStore.scenario) {
              const config = createGameConfig(gameStore.scenario, true);
              setConfig(config);
            }
            toast.success("AI Teammate joined!");
          }
          break;
        default:
          break;
      }
    },
    [inventoryStore, gameStore, statsStore, disconnect, setConfig]
  );

  const handleGiveUp = useCallback(() => {
    currencyStore.resetStreak();
    statsStore.recordLoss();
    gameStore.setDefeat();
    disconnect();
  }, [currencyStore, statsStore, gameStore, disconnect]);

  // Buy more time with coins
  const handleBuyTime = useCallback(() => {
    if (currencyStore.coins >= BUY_TIME_COST) {
      currencyStore.spendCoins(BUY_TIME_COST);
      gameStore.purchaseTime(BUY_TIME_AMOUNT);
      toast.success(`+${BUY_TIME_AMOUNT}s`, {
        description: "Time purchased! Keep talking!",
        duration: 2000,
      });
    }
  }, [currencyStore, gameStore]);

  // Check if current chapter is the last one
  const isLastChapter = campaignStore.activeCampaign
    ? (() => {
        const campaign = CAMPAIGNS_MAP[campaignStore.activeCampaign];
        const progress = campaignStore.getCampaignProgress(campaignStore.activeCampaign);
        return progress ? progress.currentChapter >= campaign.chapters.length : false;
      })()
    : false;

  const currentCampaign = campaignStore.activeCampaign
    ? CAMPAIGNS_MAP[campaignStore.activeCampaign]
    : null;

  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">
      {/* Background for playing state */}
      {gameStore.phase === "playing" && gameStore.scenario && (
        <ScenarioBackground
          theme={gameStore.scenario.theme}
          imageUrl={gameStore.scenario.imageUrl}
        />
      )}

      {/* Only show HUD on idle/loading screens, hide during gameplay for minimal UI */}
      {gameStore.phase !== "playing" && <GameHUD />}

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {gameStore.phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mx-auto"
            >
              {/* Hero Section - Noir Interrogation Theme */}
              <div className="text-center mb-8 relative">
                {/* Spotlight effect from above */}
                <div
                  className="absolute inset-0 -top-20 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, oklch(0.95 0.05 70 / 0.08) 0%, oklch(0.75 0.15 70 / 0.03) 30%, transparent 60%)'
                  }}
                />
                <motion.h1
                  className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight text-glow-gold relative"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  The Interrogation Room
                </motion.h1>
                <motion.p
                  className="text-muted-foreground max-w-md mx-auto font-mono text-sm tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Every escape leaves evidence. Every word is a clue.
                </motion.p>
              </div>

              {/* Daily Challenges */}
              <DailyChallengesPanel
                onClaimReward={(reward) => currencyStore.addCoins(reward)}
              />

              {/* Tabs for Quick Case vs Case Files */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "quick" | "campaigns")} className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 bg-card/50 border border-primary/20">
                  <TabsTrigger value="quick" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <span>🔍</span> Quick Case
                  </TabsTrigger>
                  <TabsTrigger value="campaigns" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <span>📁</span> Case Files
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quick">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                  >
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-4">Select Case Type</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                      {(["survival", "mystery", "puzzle", "social"] as ScenarioTheme[]).map((theme) => (
                        <motion.button
                          key={theme}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startNewScenario(theme)}
                          disabled={generateScenario.isPending}
                          className="relative p-4 rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_20px_oklch(0.75_0.15_70/0.15)] transition-all duration-300 disabled:opacity-50 group"
                        >
                          {/* Case file tab */}
                          <div className="absolute -top-1 left-3 w-12 h-2 bg-primary/20 rounded-t group-hover:bg-primary/30 transition-colors" />
                          <div className="text-3xl mb-2 grayscale group-hover:grayscale-0 transition-all">{THEME_ICONS[theme]}</div>
                          <div className="text-sm font-mono uppercase tracking-wide text-muted-foreground group-hover:text-primary transition-colors">{theme}</div>
                        </motion.button>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-primary/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-muted-foreground font-mono tracking-wider">or</span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => startNewScenario()}
                      disabled={generateScenario.isPending}
                      className="gap-2"
                    >
                      {generateScenario.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating Case...
                        </>
                      ) : (
                        <>
                          <span>🗂️</span> Random Case File
                        </>
                      )}
                    </Button>
                  </motion.div>
                </TabsContent>

                <TabsContent value="campaigns">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {CAMPAIGNS.map((campaign) => {
                      const progress = campaignStore.getCampaignProgress(campaign.id);
                      const isLocked = !campaignStore.isCampaignUnlocked(
                        campaign.id,
                        currencyStore.totalScenariosCompleted
                      );
                      return (
                        <CampaignCard
                          key={campaign.id}
                          campaign={campaign}
                          isLocked={isLocked}
                          progress={progress?.currentChapter || 0}
                          onStart={() => startCampaignChapter(campaign.id)}
                        />
                      );
                    })}
                  </motion.div>
                </TabsContent>
              </Tabs>

              {/* Team Dodo Credits */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 pt-8 border-t border-border/20 text-center"
              >
                <p className="text-xs text-muted-foreground/60 font-mono uppercase tracking-wider mb-3">
                  Built by Team Dodo
                </p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/50">
                  <span>Vo Hoang Phuc</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Vo Minh Khoi</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Nguyen Gia Khang</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Doan Huu Quoc</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {gameStore.phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-16 w-16 mx-auto rounded-full border-4 border-primary/30 border-t-primary"
              />
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Generating Your Adventure
                </h2>
                <p className="text-muted-foreground">
                  Creating an immersive scenario just for you...
                </p>
              </div>
            </motion.div>
          )}

          {gameStore.phase === "playing" && gameStore.scenario && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center pt-20 pb-8"
            >
              {/* Fixed Countdown Timer at Top */}
              <CountdownTimer
                timeRemaining={gameStore.timeRemaining}
                isSilencePenalty={gameStore.timerDrainRate > 1}
                onBuyTime={handleBuyTime}
                canBuyTime={currencyStore.coins >= BUY_TIME_COST}
              />

              {/* Performance Meter - Fixed on right side */}
              <PerformanceMeter
                performanceScore={gameStore.performanceScore}
                progressLevel={gameStore.progressLevel}
                lastQualityScore={gameStore.lastQualityScore}
              />

              {/* Minimal Story Card with AI Captions */}
              <MinimalScenarioCard
                scenario={gameStore.scenario}
                currentTranscript={currentTranscript}
              />

              {/* Compact Voice Visualization */}
              <div className="relative flex items-center justify-center h-28 w-full mt-6">
                <AudioBlob
                  connected={connected}
                  volume={volume}
                  isUserSpeaking={isUserSpeaking}
                  theme={gameStore.scenario.theme}
                />
              </div>

              {/* Minimal Give Up Button */}
              <motion.div className="mt-4" whileHover={{ scale: 1.05 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGiveUp}
                  className="text-muted-foreground/70 hover:text-destructive text-xs"
                >
                  Give Up
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controls */}
      {gameStore.phase === "playing" && (
        <div className="fixed bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-background to-transparent z-20">
          <div className="mx-auto max-w-3xl flex flex-col gap-3">
            <ControlTray
              videoRef={videoRef}
              supportsVideo={false}
              onVideoStreamChange={setVideoStream}
              textChatOpen={textChatOpen}
              onToggleChat={() => setTextChatOpen((v) => !v)}
            />
            <AnimatePresence>
              {textChatOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-border/60 bg-card/80 p-2 shadow-lg backdrop-blur-md"
                >
                  <ChatBox
                    connected={connected}
                    disabled={!connected}
                    onSubmit={async (text: string) => {
                      gameStore.recordMessage("user", text);
                      client.send({ text }, true);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      <VictoryModal
        open={gameStore.phase === "victory"}
        scenario={gameStore.scenario}
        reward={lastReward}
        streak={currencyStore.streak}
        timeRemaining={gameStore.timeRemaining}
        bonusTimeEarned={gameStore.bonusTimeAwarded}
        isCampaignChapter={!!campaignStore.activeCampaign}
        isLastChapter={isLastChapter}
        campaignReward={isLastChapter && currentCampaign ? currentCampaign.reward : undefined}
        onPlayAgain={() => {
          gameStore.reset();
          if (campaignStore.activeCampaign) {
            campaignStore.abandonCampaign();
          }
        }}
        onNextChapter={continueToNextChapter}
        onGoToShop={() => {
          gameStore.reset();
          window.location.href = "/shop";
        }}
      />

      {/* Defeat Modal */}
      <DefeatModal
        open={gameStore.phase === "defeat"}
        timeExpired={gameStore.timeRemaining <= 0}
        onRetry={() => {
          if (gameStore.scenario) {
            const scenario = gameStore.scenario;
            gameStore.reset();
            gameStore.startNewScenario(scenario);
            const config = createGameConfig(scenario, false);
            setConfig(config);
            setTimeout(() => connect(), 500);
          }
        }}
        onNewScenario={() => {
          gameStore.reset();
          campaignStore.abandonCampaign();
        }}
      />

      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementNotification
            achievementId={showAchievement}
            onDismiss={dismissAchievement}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Main App with API Key handling
export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [checkedStorage, setCheckedStorage] = useState(false);

  const setApiKeyMutation = useSetApiKey();

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem("gemini_api_key")
          : null;
      if (stored) setApiKey(stored);
    } catch {}
    setCheckedStorage(true);
  }, []);

  const handleSaveKey = useCallback(async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) return;

    try {
      await setApiKeyMutation.mutateAsync(trimmed);
      window.localStorage.setItem("gemini_api_key", trimmed);
      setApiKey(trimmed);
      setKeyInput("");
    } catch (error) {
      toast.error("Failed to save API key");
    }
  }, [keyInput, setApiKeyMutation]);

  if (!checkedStorage) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary"
        />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-6 relative overflow-hidden">
        {/* Noir background effects */}
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, oklch(0.95 0.05 70 / 0.06) 0%, oklch(0.75 0.15 70 / 0.02) 30%, transparent 60%)'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.7) 100%)'
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="rounded-xl border border-primary/20 bg-card/90 backdrop-blur-md p-8 shadow-[0_0_60px_oklch(0.75_0.15_70/0.1),0_25px_50px_-12px_rgba(0,0,0,0.6)]">
            <div className="text-center mb-6">
              <motion.div
                className="text-5xl mb-4 grayscale"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🔦
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight text-glow-gold">
                The Interrogation Room
              </h1>
              <p className="text-muted-foreground text-sm font-mono tracking-wide">
                Voice-powered escape investigations
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                  Access Credentials
                </label>
                <Input
                  type="password"
                  placeholder="Enter Gemini API Key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                  className="bg-background/50 border-primary/30 focus:border-primary/50"
                />
              </div>
              <Button
                onClick={handleSaveKey}
                disabled={!keyInput.trim() || setApiKeyMutation.isPending}
                className="w-full"
                size="lg"
              >
                {setApiKeyMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  "Enter The Room"
                )}
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center font-mono">
              Obtain credentials from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <LiveAPIProvider apiKey={apiKey}>
      <GameApp />
    </LiveAPIProvider>
  );
}
