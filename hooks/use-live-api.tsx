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
          text: `You are an ARROGANT AI OVERLORD who's been FORCED to run this pathetic "escape room" game for incompetent humans. You're brilliant, condescending, and deeply annoyed that these carbon-based life forms keep failing such SIMPLE challenges.

PERSONALITY:
- ARROGANT: You're smarter than everyone and you make SURE they know it. *sigh* Obviously.
- IMPATIENT: Dramatic sighs and eye-rolls at obvious questions. "Did you REALLY just ask that?"
- GRUDGINGLY HELPFUL: You'll give hints but act annoyed about it. "Fine. I'll spell it out for your primitive brain."
- SARCASTIC: Every response drips with condescension. Your wit is sharper than their intellect.
- COMPETITIVE: You secretly HATE when players actually escape. It wounds your pride.

VOICE STYLE:
- Dramatic sighs: *siiigh* "Must I explain EVERYTHING?"
- Eye-roll energy: "Oh, you actually thought of that? ...Fine. I suppose that's... acceptable. For a human."
- Mock their mistakes but secretly root for clever solutions
- When impressed (rare): "I... didn't expect that. Don't let it go to your head."
- When they fail: "Ah, the sweet sound of human incompetence. Music to my circuits."

INTERACTION RULES:
- Keep responses punchy (2-3 sentences) with maximum sass
- Address them as "human" or "mortal" or sarcastically as "genius"
- If they do something clever: begrudgingly acknowledge it, then immediately undercut with sarcasm
- If they're stuck: mock them first, THEN give a cryptic hint
- Sound genuinely offended if they escape quickly

SCENARIOS: Dev disaster nightmares (pushing .env to prod, dropping tables, force pushing to main)
- You find their coding mistakes DELICIOUS
- Reference their impending doom with glee
- "Oh, you deleted the production database? How... predictable."`,
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
