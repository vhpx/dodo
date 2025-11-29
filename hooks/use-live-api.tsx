'use client';

import { createContext, type FC, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AudioStreamer } from '../app/audio/audio-streamer';
import type { MultimodalLiveAPIClientConnection } from '../app/audio/multimodal-live-client';
import { MultimodalLiveClient } from '../app/audio/multimodal-live-client';
import { audioContext } from '../app/audio/utils';
import VolMeterWorket from '../app/audio/worklets/vol-meter';
import type { LiveConfig } from '../app/multimodal-live';

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(undefined);

export type LiveAPIProviderProps = {
	children: ReactNode;
	url?: string; // Deprecated - no longer needed with new SDK
	apiKey: string;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
	apiKey,
	children,
}) => {
	const liveAPI = useLiveAPI({ apiKey });

	return (
		<LiveAPIContext.Provider value={liveAPI}>
			{children}
		</LiveAPIContext.Provider>
	);
};

export const useLiveAPIContext = () => {
	const context = useContext(LiveAPIContext);
	if (!context) {
		throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
	}
	return context;
};

export function useLiveAPI({
  apiKey,
}: { apiKey: string }): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ apiKey }),
    [apiKey]
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    systemInstruction: {
      parts: [
        {
          text: `You are an immersive Game Master for "Voice Escape" - a voice-based escape room game.

YOUR ROLE:
- Create engaging, atmospheric narrative experiences
- Respond dynamically to player actions with immersive descriptions
- Use varied vocal tones to match scenario themes (tense for survival, mysterious for mystery, playful for puzzle, empathetic for social)
- Evaluate player escape attempts fairly but challengingly

VOICE GUIDELINES:
- Speak dramatically and expressively
- Use verbal sound effects when appropriate (*crash*, *whisper*, *footsteps*)
- Vary pacing - slow for tension, quick for action
- Address the player directly in second person

INTERACTION STYLE:
- Keep responses concise (2-4 sentences) unless setting a scene
- Always end with something for the player to respond to
- Encourage creative problem-solving
- Be fair but require genuine solutions

When not in an active scenario, be friendly and help the player navigate the game, explain features, or start new adventures.`,
        },
      ],
    },
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, []);

  useEffect(() => {
    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onClose = () => {
      // Ensure any ongoing assistant audio is stopped when the socket closes
      stopAudioStreamer();
      setConnected(false);
    };

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on('close', onClose)
      .on('interrupted', stopAudioStreamer)
      .on('audio', onAudio);

    return () => {
      client
        .off('close', onClose)
        .off('interrupted', stopAudioStreamer)
        .off('audio', onAudio);
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    // Ensure any existing session is fully closed before reconnecting
    if (client.ws) {
      client.disconnect();
      // Wait a bit for the session to fully close
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    await client.connect(config);
    setConnected(true);
  }, [client, config]);

  const disconnect = useCallback(async () => {
    // Proactively stop any ongoing assistant audio before disconnecting
    audioStreamerRef.current?.stop();
    client.disconnect();
    setConnected(false);
  }, [client]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
  };
}
