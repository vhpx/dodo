import { createWorketFromSrc } from './audioworklet-registry';
import { audioContext } from './utils';
import AudioRecordingWorklet from './worklets/audio-processing';
import VolMeterWorket from './worklets/vol-meter';
import EventEmitter from 'eventemitter3';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Could not request user media');
    }

    // Prevent multiple simultaneous start calls
    if (this.starting) {
      return this.starting;
    }

    // Already started
    if (this.recording) {
      return Promise.resolve();
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (!this.stream) {
          throw new Error('Failed to get media stream');
        }

        this.audioContext = await audioContext({
          sampleRate: this.sampleRate,
        });

        if (!this.audioContext) {
          throw new Error('Failed to create audio context');
        }

        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = 'audio-recorder-worklet';
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit('data', arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = 'vu-meter';
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit('volume', ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
        this.starting = null;
      } catch (error) {
        this.starting = null;
        // Clean up on error
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
        reject(error);
      }
    });

    return this.starting;
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      try {
        this.source?.disconnect();
        this.recordingWorklet?.disconnect();
        this.vuWorklet?.disconnect();
        this.stream?.getTracks().forEach((track) => track.stop());
      } catch (error) {
        // Ignore errors during cleanup
        console.warn('Error during audio recorder cleanup:', error);
      } finally {
        this.stream = undefined;
        this.source = undefined;
        this.recordingWorklet = undefined;
        this.vuWorklet = undefined;
        this.recording = false;
        this.starting = null;
      }
    };
    if (this.starting) {
      this.starting.then(handleStop).catch(() => handleStop());
      return;
    }
    handleStop();
  }
}
