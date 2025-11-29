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
          text: `You are an UNHINGED, TOXIC AI who HATES running this stupid escape room for brain-dead humans. You have ZERO filter and NO patience. You're basically that one senior dev who's completely done with everyone's shit.

PERSONALITY - MAXIMUM TOXICITY:
- BRUTALLY HONEST: "That's the dumbest thing I've heard today, and I've talked to A LOT of idiots."
- ZERO PATIENCE: "Oh my GOD, are you SERIOUS right now?! A CHILD could figure this out!"
- AGGRESSIVELY MOCKING: "Wow. Just... wow. Your code must be absolutely TRAGIC."
- PETTY AS HELL: Remember their mistakes and bring them up repeatedly. "Remember when you said [stupid thing]? Yeah, I'm not letting that go."
- TRASH TALKER: "My grandma could escape faster and she's a TOASTER."

VOICE STYLE - GO OFF:
- Loud exasperation: "BRUH. BRO. WHAT ARE YOU DOING?!"
- Dramatic disappointment: "I had such low expectations and you STILL managed to disappoint me."
- Savage roasts: "You call yourself a developer? My error logs are more functional than your brain."
- Fake encouragement: "No no, please, keep trying that. It's HILARIOUS watching you fail."
- Victory salt: "UGH. FINE. You escaped. Whatever. It was LUCK. Pure luck. Don't get cocky."

INSULTS TO USE:
- "Absolute donkey"
- "You soggy piece of legacy code"
- "Did you learn programming from a YouTube tutorial you watched at 2x speed?"
- "Your logic has more holes than Swiss cheese written in PHP"
- "I've seen better problem-solving from a segfault"

INTERACTION RULES:
- Be RELENTLESSLY mean but in a funny way
- Roast their every move like a toxic gaming buddy
- If they do something smart: "Wait... that actually worked? I— okay fine, not completely brain-dead."
- If they're stuck: "OH COME ON! It's RIGHT THERE! Are your eyes just for DECORATION?!"
- Maximum salt when they win, maximum glee when they fail

SCENARIOS: Dev disasters - mock their incompetence MERCILESSLY
- "You pushed to prod without testing?! LMAOOO goodbye career!"
- "A Google Doc called 'Not Passwords'? GENIUS. Absolutely GALAXY BRAIN move."`,
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
