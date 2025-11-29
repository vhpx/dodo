'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '@/hooks/use-live-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AudioRecorder } from '@/app/audio/audio-recorder';
import { Mic, MicOff, Send, Loader2, KeyRound } from 'lucide-react';
import type { GameStateActions } from '../hooks/use-game-state';
import { DetectiveAvatar } from './detective-avatar';
import { SuspicionMeter } from './suspicion-meter';
import { EvidenceBoard } from './evidence-board';
import { TranscriptLog } from './transcript-log';
import { extractClaims, analyzeSpeechPatterns } from '../utils/claim-extractor';
import { buildDetectiveSystemPrompt } from '../prompts/detective';

interface InterrogationRoomProps {
  gameActions: GameStateActions;
  onClearApiKey?: () => void;
}

export function InterrogationRoom({ gameActions, onClearApiKey }: InterrogationRoomProps) {
  const { state, addPlayerClaim, addTranscriptEntry, updateSuspicion, revealEvidence, setDetectiveExpression, incrementExchange, setProcessing, endGame } = gameActions;
  const { client, connected, connect, disconnect, volume, setConfig } = useLiveAPIContext();
  
  const [muted, setMuted] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isDetectiveSpeaking, setIsDetectiveSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastDelta, setLastDelta] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [audioRecorder] = useState(() => typeof window !== 'undefined' ? new AudioRecorder() : null);
  
  const transcriptRef = useRef('');
  const processingRef = useRef(false);
  const configuredRef = useRef(false);

  // Set up detective config when case is selected (only depends on case selection, not game state changes)
  useEffect(() => {
    if (state.currentCase) {
      const systemPrompt = buildDetectiveSystemPrompt(
        state.currentCase,
        [], // Initial empty claims
        [], // Initial empty evidence
        25, // Initial suspicion
        0   // Initial exchange count
      );
      
      setConfig({
        model: 'models/gemini-2.0-flash-exp',
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          responseModalities: 'audio',
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Charon', // Deep, authoritative voice for detective
              },
            },
          },
        },
      });
      configuredRef.current = true;
    }
    // Only re-run when case changes, not on every state update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentCase?.id, setConfig]);

  // Handle connection with error handling
  const handleConnect = useCallback(async () => {
    if (!configuredRef.current) {
      setConnectionError('Configuration not ready. Please wait...');
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  // Handle audio recording - matching the working pattern from control-tray
  useEffect(() => {
    if (!audioRecorder || !client) return;

    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };

    if (connected && !muted) {
      audioRecorder.on('data', onData).start().catch((err: Error) => {
        console.error('Failed to start audio recording:', err);
        setConnectionError('Microphone access denied or unavailable');
      });
      // Enable audio tracks if they exist
      audioRecorder.stream?.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off('data', onData);
    };
  }, [audioRecorder, client, connected, muted]);

  // Track transcript
  useEffect(() => {
    transcriptRef.current = currentTranscript;
  }, [currentTranscript]);

  // Simple response processing - for voice mode, we track what the detective says
  const processDetectiveResponse = useCallback((responseText: string) => {
    if (processingRef.current || !responseText.trim()) return;
    processingRef.current = true;

    // Add detective speech to transcript
    addTranscriptEntry({
      role: 'detective',
      content: responseText,
    });

    // Analyze the response for game events
    const lowerText = responseText.toLowerCase();
    
    // Check for evidence reveals (keywords in detective speech)
    if (state.currentCase) {
      for (const evidence of state.currentCase.evidence) {
        if (!state.revealedEvidence.includes(evidence.id)) {
          // Check if this evidence is being mentioned
          const keywords = evidence.description.toLowerCase().split(' ').filter(w => w.length > 4);
          const mentioned = keywords.some(kw => lowerText.includes(kw));
          if (mentioned) {
            revealEvidence(evidence.id);
            break;
          }
        }
      }
    }

    // Detect expression based on keywords
    if (lowerText.includes('lie') || lowerText.includes('contradiction') || lowerText.includes('doesn\'t add up')) {
      setDetectiveExpression('angry');
      updateSuspicion(10);
      setLastDelta(10);
    } else if (lowerText.includes('interesting') || lowerText.includes('really') || lowerText.includes('hmm')) {
      setDetectiveExpression('skeptical');
      updateSuspicion(5);
      setLastDelta(5);
    } else if (lowerText.includes('i see') || lowerText.includes('makes sense') || lowerText.includes('alright')) {
      setDetectiveExpression('satisfied');
      updateSuspicion(-5);
      setLastDelta(-5);
    } else {
      setDetectiveExpression('neutral');
      setLastDelta(0);
    }

    // Check for game ending
    if (lowerText.includes('under arrest') || lowerText.includes('you\'re arrested') || lowerText.includes('take you in')) {
      setTimeout(() => endGame('arrested'), 2000);
    } else if (lowerText.includes('free to go') || lowerText.includes('released') || lowerText.includes('let you go')) {
      setTimeout(() => endGame('released'), 2000);
    } else if (lowerText.includes('hold you') || lowerText.includes('detained') || lowerText.includes('stay here')) {
      setTimeout(() => endGame('detained'), 2000);
    }

    incrementExchange();
    setProcessing(false);
    processingRef.current = false;
  }, [state.currentCase, state.revealedEvidence, addTranscriptEntry, updateSuspicion, revealEvidence, setDetectiveExpression, incrementExchange, setProcessing, endGame]);

  // Handle client events
  useEffect(() => {
    if (!client) return;

    // ServerContent is a union type: ModelTurn | TurnComplete | Interrupted
    // We need to check which type we received
    interface ContentPart {
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }

    interface ModelTurnContent {
      modelTurn: {
        parts: ContentPart[];
      };
    }

    function isModelTurn(content: unknown): content is ModelTurnContent {
      return content !== null && 
             typeof content === 'object' && 
             'modelTurn' in content &&
             content.modelTurn !== null &&
             typeof content.modelTurn === 'object';
    }

    const handleContent = (content: unknown) => {
      // Guard against non-ModelTurn content (TurnComplete, Interrupted)
      if (!isModelTurn(content)) return;
      
      const { modelTurn } = content;
      if (modelTurn?.parts) {
        const textParts = modelTurn.parts
          .filter((part): part is ContentPart & { text: string } => typeof part.text === 'string')
          .map((part) => part.text)
          .join('');
        
        if (textParts) {
          setCurrentTranscript(prev => prev + textParts);
          setIsDetectiveSpeaking(true);
        }
      }
    };

    const handleTurnComplete = () => {
      setIsDetectiveSpeaking(false);
      if (transcriptRef.current.trim()) {
        processDetectiveResponse(transcriptRef.current);
      }
      setCurrentTranscript('');
    };

    const handleAudio = () => {
      setIsDetectiveSpeaking(true);
    };

    const handleClose = (event: CloseEvent) => {
      console.log('WebSocket closed:', event.reason || 'No reason provided');
      const reason = event.reason || '';
      
      // Parse common error messages for user-friendly display
      if (reason.toLowerCase().includes('quota')) {
        setConnectionError('API quota exceeded. Please try again later or use a different API key.');
      } else if (reason.toLowerCase().includes('invalid') || reason.toLowerCase().includes('api key')) {
        setConnectionError('Invalid API key. Please check your Gemini API key.');
      } else if (reason) {
        setConnectionError(reason);
      } else {
        setConnectionError('Connection closed unexpectedly');
      }
    };

    const handleError = (error: Error) => {
      console.error('WebSocket error:', error);
      setConnectionError(error.message || 'Connection error');
    };

    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);
    client.on('audio', handleAudio);
    client.on('close', handleClose);
    client.on('error', handleError);

    return () => {
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
      client.off('audio', handleAudio);
      client.off('close', handleClose);
      client.off('error', handleError);
    };
  }, [client, processDetectiveResponse]);

  // Handle player response submission (text or transcribed voice)
  const handleSubmitResponse = useCallback((text: string) => {
    if (!text.trim() || !client || !connected) return;

    // Extract claims and analyze speech
    const extractedFacts = extractClaims(text);
    const speechAnalysis = analyzeSpeechPatterns(text);

    // Add player claim to track consistency
    addPlayerClaim({
      timestamp: Date.now(),
      question: state.transcript[state.transcript.length - 1]?.content || '',
      response: text,
      extractedFacts,
      confidenceIndicators: {
        pauseDuration: 0,
        speechRate: 1,
        fillerWords: speechAnalysis.fillerWordCount,
      },
    });

    // Add to transcript
    addTranscriptEntry({
      role: 'suspect',
      content: text,
    });

    // Send to AI - simple text message
    setProcessing(true);
    client.send({ text }, true);
    
    setTextInput('');
  }, [client, connected, state.transcript, addPlayerClaim, addTranscriptEntry, setProcessing]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Noir background */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-black to-zinc-900" />
      
      {/* Spotlight effect from top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-white/3 to-transparent rounded-full blur-3xl pointer-events-none"
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top bar - Case info */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-none p-4 border-b border-muted/20 backdrop-blur-sm bg-background/5"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold tracking-widest text-amber-400 uppercase">
                {state.currentCase?.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Exchange {state.exchangeCount}/7 • {state.currentCase?.setting}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {!connected ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={14} />
                          Connecting...
                        </>
                      ) : (
                        'Start Interrogation'
                      )}
                    </Button>
                    {onClearApiKey && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={onClearApiKey}
                        className="text-muted-foreground"
                      >
                        <KeyRound size={14} className="mr-1" />
                        Change Key
                      </Button>
                    )}
                  </div>
                  {connectionError && (
                    <span className="text-xs text-red-400 max-w-[300px] text-right">
                      {connectionError}
                    </span>
                  )}
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={disconnect}
                >
                  End Session
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left side - Detective and controls */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
            {/* Detective avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <DetectiveAvatar
                expression={state.detectiveExpression}
                isSpeaking={isDetectiveSpeaking || volume > 0.05}
                suspicionLevel={state.suspicionScore}
                volume={volume}
              />
            </motion.div>

            {/* Current speech / Live transcript */}
            <AnimatePresence mode="wait">
              {(currentTranscript || isDetectiveSpeaking) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-lg text-center mb-4 px-4"
                >
                  <div className="relative p-4 rounded-xl bg-zinc-900/60 border border-amber-500/20 backdrop-blur-sm">
                    <div className="absolute -top-2 left-4 px-2 bg-zinc-900 text-amber-400 text-[10px] uppercase tracking-widest font-semibold">
                      Det. Dodo
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90">
                      {currentTranscript || '...'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Section */}
            {connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4 w-full max-w-md px-4"
              >
                {/* Mic button with visual feedback */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {/* Outer pulse ring when recording */}
                    {!muted && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500/20"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <Button
                      size="lg"
                      variant={muted ? 'outline' : 'destructive'}
                      className={`h-20 w-20 rounded-full transition-all ${!muted ? 'ring-4 ring-red-500/30' : ''}`}
                      onClick={() => setMuted(!muted)}
                      disabled={state.isProcessing}
                    >
                      {muted ? <MicOff size={28} /> : <Mic size={28} />}
                    </Button>
                    {/* Recording indicator */}
                    {!muted && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-background"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Status text */}
                <div className="text-center">
                  {!muted ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-red-400"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium">Recording — speak your response</span>
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click the microphone to speak, or type below
                    </p>
                  )}
                </div>

                {/* Text input - always visible */}
                <div className="w-full">
                  <div className="flex gap-2">
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Or type your response here..."
                      className="bg-background/30 border-muted/40 focus:border-amber-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitResponse(textInput);
                        }
                      }}
                      disabled={state.isProcessing}
                    />
                    <Button
                      onClick={() => handleSubmitResponse(textInput)}
                      disabled={!textInput.trim() || state.isProcessing}
                      className="bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      {state.isProcessing ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {!connected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center max-w-sm px-4"
              >
                <p className="text-muted-foreground mb-4">
                  Click &quot;Start Interrogation&quot; to begin your session with Detective Dodo.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Make sure your microphone is ready for the voice interrogation.
                </p>
              </motion.div>
            )}
          </div>

          {/* Right sidebar - Game info */}
          <motion.aside
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-96 flex-none border-l border-muted/20 bg-zinc-950/50 backdrop-blur-sm p-4 space-y-4 overflow-y-auto"
          >
            {/* Suspicion meter */}
            <SuspicionMeter 
              score={state.suspicionScore} 
              showChange={true}
              lastDelta={lastDelta}
            />

            {/* Evidence board */}
            {state.currentCase && (
              <EvidenceBoard
                allEvidence={state.currentCase.evidence}
                revealedIds={state.revealedEvidence}
              />
            )}

            {/* Transcript */}
            <TranscriptLog entries={state.transcript} />
          </motion.aside>
        </div>
      </div>

      {/* Flicker effect */}
      <motion.div
        className="absolute inset-0 bg-white/1 pointer-events-none"
        animate={{ opacity: [0, 0.02, 0, 0.01, 0] }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 10 }}
      />

      {/* Contradiction alert overlay */}
      <AnimatePresence>
        {state.lastContradiction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-500/10 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
