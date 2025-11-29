'use client';

import { AudioRecorder } from '@/app/audio/audio-recorder';
import { useLiveAPIContext } from '@/hooks/use-live-api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '../../hooks/use-game-state';
import type { Difficulty } from '../../types/game.types';
import { buildProsecutorPrompt, buildVerdictPrompt } from '../../utils/prompt-builder';
import { ChatSidebar } from './chat-sidebar';
import { DifficultySelector } from './difficulty-selector';
import { GameControls } from './game-controls';
import { GameHeader } from './game-header';
import { ParticipantCards } from './participant-cards';
import { VerdictModal } from './verdict-modal';

export function GameContainer() {
  const { client, connected, setConfig, connect, disconnect, volume } = useLiveAPIContext();
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [configSet, setConfigSet] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const timerIntervalRef = useRef<number | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  const {
    phase,
    difficulty,
    crime,
    evidence,
    timeRemaining,
    messages,
    verdictText,
    isGuilty,
    convictionLevel,
    setPhase,
    setDifficulty,
    generateScenario,
    setTimeRemaining,
    addMessage,
    updateMessage,
    finalizeMessage,
    updateVerdictText,
    setVerdict,
    resetGame,
  } = useGameState();

  // Initialize audio recorder when needed
  useEffect(() => {
    if (phase === 'defense' && !audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();

      const handleVolume = (volume: number) => {
        setIsUserSpeaking(volume > 0.1);
      };

      audioRecorderRef.current.on('volume', handleVolume);
    }

    // Cleanup on unmount
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.off('volume', () => {});
        audioRecorderRef.current.stop();
      }
    };
  }, [phase]);

  // Handle difficulty selection
  const handleDifficultySelect = useCallback(
    async (selectedDifficulty: Difficulty) => {
      setDifficulty(selectedDifficulty);
      generateScenario();

      // Wait for scenario to be generated, then go straight to defense (the conversation)
      setTimeout(async () => {
        setPhase('defense');
      }, 100);
    },
    [setDifficulty, generateScenario, setPhase]
  );

  // Configure AI when entering defense phase (the conversation)
  useEffect(() => {
    if (crime && difficulty && phase === 'defense' && !configSet) {
      setConfig({
        model: 'models/gemini-2.0-flash-exp',
        systemInstruction: {
          parts: [{ text: buildProsecutorPrompt(crime, evidence, difficulty) }],
        },
        generationConfig: {
          responseModalities: 'audio',
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });
      // Defer state update to avoid synchronous setState in effect
      queueMicrotask(() => setConfigSet(true));
    }
  }, [crime, difficulty, evidence, phase, configSet, setConfig]);

  // Connect after config is set
  useEffect(() => {
    if (configSet && !connected && phase === 'defense') {
      const doConnect = async () => {
        await connect();
      };
      doConnect();
    }
  }, [configSet, connected, phase, connect]);

  // Listen for setup complete
  useEffect(() => {
    if (!client) return;

    const handleSetupComplete = () => {
      // Defer state updates to avoid synchronous setState in effect callback
      queueMicrotask(() => {
        setSetupComplete(true);
        addMessage('system', 'Session started - Prosecutor is connecting...');
      });
    };

    client.on('setupcomplete', handleSetupComplete);

    return () => {
      client.off('setupcomplete', handleSetupComplete);
    };
  }, [client, addMessage]);

  // Start conversation when setup is complete
  useEffect(() => {
    if (setupComplete && connected && phase === 'defense' && crime) {
      // Start the 60-second conversation immediately
      // AI will begin with accusation, user can respond anytime
      setTimeout(() => {
        if (client.ws) {
          client.send(
            [
              {
                text: 'Begin the conversation now. Start with your accusation and present the evidence. Remember, the defendant will defend themselves during our 60-second conversation.',
              },
            ],
            true
          );
        }
      }, 500);
    }
  }, [setupComplete, connected, phase, crime, client]);

  // Handle defense phase timer
  useEffect(() => {
    if (phase === 'defense') {
      let currentTime = 60;
      // Defer initial state update
      queueMicrotask(() => setTimeRemaining(currentTime));

      timerIntervalRef.current = window.setInterval(() => {
        currentTime -= 1;
        setTimeRemaining(currentTime);

        if (currentTime <= 0) {
          // Time's up, move to verdict
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          setPhase('verdict');
        }
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [phase, setTimeRemaining, setPhase]);

  // Handle verdict phase
  useEffect(() => {
    if (connected && phase === 'verdict') {
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Defer state updates to avoid synchronous setState in effect
      queueMicrotask(() => {
        // Finalize any streaming message
        if (currentMessageIdRef.current) {
          finalizeMessage(currentMessageIdRef.current);
          currentMessageIdRef.current = null;
        }

        // Add system message
        addMessage('system', 'Session ended - Awaiting verdict...');
      });

      // Request verdict from AI
      setTimeout(() => {
        client.send([{ text: buildVerdictPrompt() }], true);
      }, 500);
    }
  }, [connected, phase, client, addMessage, finalizeMessage]);

  // Handle microphone toggle
  const handleToggleMic = useCallback(async () => {
    if (!audioRecorderRef.current) return;

    if (isMicActive) {
      audioRecorderRef.current.stop();
      setIsMicActive(false);
    } else {
      try {
        await audioRecorderRef.current.start();
        setIsMicActive(true);
      } catch (error) {
        console.error('Failed to start microphone:', error);
      }
    }
  }, [isMicActive]);

  // Handle audio streaming during defense
  useEffect(() => {
    if (phase === 'defense' && connected && audioRecorderRef.current && isMicActive) {
      const handleAudioData = (base64: string) => {
        client.sendRealtimeInput([
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          },
        ]);
      };

      audioRecorderRef.current.on('data', handleAudioData);

      return () => {
        if (audioRecorderRef.current) {
          audioRecorderRef.current.off('data', handleAudioData);
        }
      };
    }
  }, [phase, connected, client, isMicActive]);

  // Handle AI responses
  useEffect(() => {
    if (!client) return;

    const handleContent = (content: any) => {
      if (content?.modelTurn?.parts && Array.isArray(content.modelTurn.parts)) {
        const text = content.modelTurn.parts
          .filter((part: any) => typeof part.text === 'string')
          .map((part: any) => part.text)
          .join('');

        if (text) {
          // Defer state updates to avoid potential synchronous setState issues
          queueMicrotask(() => {
            if (phase === 'defense') {
              // Stream to chat sidebar
              if (!currentMessageIdRef.current) {
                currentMessageIdRef.current = addMessage('prosecutor', text);
              } else {
                updateMessage(currentMessageIdRef.current, text);
              }
            } else if (phase === 'verdict') {
              updateVerdictText(text);
            }
          });
        }
      }
    };

    const handleTurnComplete = () => {
      // Defer state updates
      queueMicrotask(() => {
        // Finalize the current streaming message
        if (currentMessageIdRef.current) {
          finalizeMessage(currentMessageIdRef.current);
          currentMessageIdRef.current = null;
        }

        if (phase === 'verdict' && verdictText) {
          // Parse verdict
          const guilty = /\b(guilty|convicted)\b/i.test(verdictText);
          const percentMatch = verdictText.match(/(\d+)%/);
          const conviction = percentMatch ? parseInt(percentMatch[1]) : guilty ? 75 : 35;
          setVerdict(guilty, conviction, verdictText);
        }
      });
    };

    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [
    client,
    phase,
    verdictText,
    addMessage,
    updateMessage,
    finalizeMessage,
    updateVerdictText,
    setVerdict,
  ]);

  // Handle end conversation early
  const handleEndConversation = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setIsMicActive(false);
    }
    setPhase('verdict');
  }, [setPhase]);

  // Handle play again
  const handlePlayAgain = useCallback(async () => {
    // Stop and cleanup audio recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
      setIsMicActive(false);
    }

    await disconnect();
    setSetupComplete(false);
    setConfigSet(false);
    setIsChatOpen(true);
    currentMessageIdRef.current = null;
    resetGame();
  }, [disconnect, resetGame]);

  // Handle chat toggle
  const handleToggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  // Render based on phase
  if (phase === 'setup') {
    return <DifficultySelector onSelect={handleDifficultySelect} />;
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <GameHeader difficulty={difficulty} phase={phase} crime={crime} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Call Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-zinc-900 to-zinc-950">
          {/* Participant Cards */}
          <ParticipantCards
            isMicActive={isMicActive}
            isUserSpeaking={isUserSpeaking}
            aiVolume={volume}
            connected={connected}
          />

          {/* Connection Status */}
          {!connected && phase === 'defense' && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-zinc-700 border-t-violet-500 animate-spin" />
                <p className="text-zinc-400 text-sm">Connecting to courtroom...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <ChatSidebar messages={messages} isOpen={isChatOpen} />
      </div>

      {/* Bottom Control Bar - Only during defense */}
      {phase === 'defense' && (
        <GameControls
          isRecording={isMicActive}
          isUserSpeaking={isUserSpeaking}
          onToggleMic={handleToggleMic}
          onEndConversation={handleEndConversation}
          onToggleChat={handleToggleChat}
          isChatOpen={isChatOpen}
          disabled={!connected}
          timeRemaining={timeRemaining}
        />
      )}

      {/* Verdict Modal */}
      <VerdictModal
        open={phase === 'verdict' && verdictText.length > 0}
        isGuilty={isGuilty}
        convictionLevel={convictionLevel}
        verdictText={verdictText}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
}
