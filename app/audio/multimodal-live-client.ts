import { GoogleGenAI, Modality, type Session, type LiveServerMessage } from "@google/genai";
import { EventEmitter } from "eventemitter3";
import type {
	LiveConfig,
	StreamingLog,
	ToolCall,
	ToolCallCancellation,
	ToolResponseMessage,
	ServerContent,
} from "../multimodal-live";

/**
 * Events emitted by the client
 */
interface MultimodalLiveClientEventTypes {
	open: () => void;
	log: (log: StreamingLog) => void;
	close: (event: { reason: string }) => void;
	error: (error: Error) => void;
	audio: (data: ArrayBuffer) => void;
	content: (data: ServerContent) => void;
	interrupted: () => void;
	setupcomplete: () => void;
	turncomplete: () => void;
	toolcall: (toolCall: ToolCall) => void;
	toolcallcancellation: (toolcallCancellation: ToolCallCancellation) => void;
}

export type MultimodalLiveAPIClientConnection = {
	url?: string;
	apiKey: string;
};

/**
 * Client for Google's Gemini Live API using @google/genai SDK
 */
export class MultimodalLiveClient extends EventEmitter<MultimodalLiveClientEventTypes> {
	private ai: GoogleGenAI;
	private session: Session | null = null;
	protected config: LiveConfig | null = null;
	public url: string = "";

	// Expose ws-like property for compatibility checks
	public get ws(): Session | null {
		return this.session;
	}

	constructor({ apiKey }: MultimodalLiveAPIClientConnection) {
		super();
		// Use v1alpha API version for affective dialog and other native audio features
		this.ai = new GoogleGenAI({
			apiKey,
			httpOptions: { apiVersion: "v1alpha" }
		});
		this.send = this.send.bind(this);
	}

	getConfig() {
		return { ...this.config };
	}

	log(type: string, message: StreamingLog["message"]) {
		const log: StreamingLog = {
			date: new Date(),
			type,
			message,
		};
		this.emit("log", log);
	}

	async connect(config: LiveConfig): Promise<boolean> {
		this.config = config;

		try {
			// Build the SDK config from our LiveConfig
			const sdkConfig: Record<string, unknown> = {
				responseModalities: [Modality.AUDIO],
			};

			// Add speech config if provided
			if (config.generationConfig?.speechConfig) {
				sdkConfig.speechConfig = config.generationConfig.speechConfig;
			}

			// Add system instruction if provided - convert from parts format to string
			if (config.systemInstruction) {
				if (typeof config.systemInstruction === 'string') {
					sdkConfig.systemInstruction = config.systemInstruction;
				} else if (config.systemInstruction.parts) {
					// Extract text from parts array
					const text = config.systemInstruction.parts
						.map((p) => p.text || '')
						.join('\n');
					sdkConfig.systemInstruction = text;
				}
			}

			// Add tools if provided
			if (config.tools) {
				sdkConfig.tools = config.tools;
			}

			// Enable affective dialog if specified
			if (config.generationConfig?.enableAffectiveDialog) {
				sdkConfig.enableAffectiveDialog = true;
			}

			// Enable output transcription for text display
			sdkConfig.outputAudioTranscription = {};

			this.session = await this.ai.live.connect({
				model: config.model,
				config: sdkConfig,
				callbacks: {
					onopen: () => {
						this.log("client.open", "connected to Gemini Live");
						this.emit("open");
						// Emit setup complete after connection
						this.log("server.send", "setupComplete");
						this.emit("setupcomplete");
					},
					onmessage: (message: LiveServerMessage) => {
						this.handleMessage(message);
					},
					onerror: (e: ErrorEvent) => {
						const error = new Error(e.message || "Connection error");
						this.log("server.error", error.message);
						this.emit("error", error);
					},
					onclose: (event: { code: number; reason: string; wasClean: boolean }) => {
						this.log("server.close", `disconnected: ${event.reason || "unknown"}`);
						this.emit("close", { reason: event.reason });
						this.session = null;
					},
				},
			});

			return true;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			this.log("client.error", err.message);
			this.emit("error", err);
			throw err;
		}
	}

	private handleMessage(message: LiveServerMessage) {
		// Handle tool calls
		if (message.toolCall) {
			this.log("server.toolCall", JSON.stringify(message.toolCall));
			const toolCall: ToolCall = {
				functionCalls: message.toolCall.functionCalls?.map((fc) => ({
					name: fc.name || "",
					id: fc.id || "",
					args: fc.args || {},
				})) || [],
			};
			this.emit("toolcall", toolCall);
			return;
		}

		// Handle tool call cancellation
		if (message.toolCallCancellation) {
			this.log("server.toolCallCancellation", JSON.stringify(message.toolCallCancellation));
			this.emit("toolcallcancellation", {
				ids: message.toolCallCancellation.ids || [],
			});
			return;
		}

		// Handle server content
		if (message.serverContent) {
			const serverContent = message.serverContent;

			// Check for interruption
			if (serverContent.interrupted) {
				this.log("server.interrupted", "generation interrupted");
				this.emit("interrupted");
				return;
			}

			// Check for turn complete
			if (serverContent.turnComplete) {
				this.log("server.turncomplete", "turn complete");
				this.emit("turncomplete");
			}

			// Handle model turn with parts
			if (serverContent.modelTurn?.parts) {
				const parts = serverContent.modelTurn.parts;

				// Extract audio parts
				for (const part of parts) {
					if (part.inlineData?.mimeType?.startsWith("audio/")) {
						const base64 = part.inlineData.data;
						if (base64) {
							const data = this.base64ToArrayBuffer(base64);
							this.emit("audio", data);
							this.log("server.audio", `buffer (${data.byteLength})`);
						}
					}
				}

				// Extract text parts and emit content
				const textParts = parts
					.filter((p) => p.text || (p.inlineData && !p.inlineData.mimeType?.startsWith("audio/")))
					.map((p) => ({ text: p.text || "" }));
				if (textParts.length > 0) {
					this.emit("content", { modelTurn: { parts: textParts } } as ServerContent);
					this.log("server.content", JSON.stringify(textParts));
				}
			}

			// Handle output transcription
			if (serverContent.outputTranscription?.text) {
				const text = serverContent.outputTranscription.text;
				this.emit("content", { modelTurn: { parts: [{ text }] } });
				this.log("server.transcription", text);
			}
		}
	}

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binaryString = atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	disconnect(_session?: Session) {
		if (this.session) {
			try {
				this.session.close();
			} catch {
				// Ignore errors during close
			}
			this.session = null;
			this.log("client.close", "Disconnected");
			return true;
		}
		return false;
	}

	/**
	 * Send realtime audio/video input
	 */
	sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
		if (!this.session) {
			throw new Error("Session is not connected");
		}

		let hasAudio = false;
		let hasVideo = false;

		for (const chunk of chunks) {
			if (chunk.mimeType.includes("audio")) {
				hasAudio = true;
				this.session.sendRealtimeInput({
					audio: {
						data: chunk.data,
						mimeType: chunk.mimeType,
					},
				});
			}
			if (chunk.mimeType.includes("image")) {
				hasVideo = true;
				this.session.sendRealtimeInput({
					video: {
						data: chunk.data,
						mimeType: chunk.mimeType,
					},
				});
			}
		}

		const message =
			hasAudio && hasVideo
				? "audio + video"
				: hasAudio
					? "audio"
					: hasVideo
						? "video"
						: "unknown";
		this.log("client.realtimeInput", message);
	}

	/**
	 * Send a tool response
	 */
	sendToolResponse(toolResponse: ToolResponseMessage["toolResponse"]) {
		if (!this.session) {
			throw new Error("Session is not connected");
		}

		this.session.sendToolResponse({
			functionResponses: toolResponse.functionResponses.map((fr) => ({
				id: fr.id,
				response: fr.response as Record<string, unknown>,
			})),
		});
		this.log("client.toolResponse", JSON.stringify(toolResponse));
	}

	/**
	 * Send text or content
	 */
	send(parts: { text?: string } | Array<{ text?: string }>, turnComplete: boolean = true) {
		if (!this.session) {
			throw new Error("Session is not connected");
		}

		const partsArray = Array.isArray(parts) ? parts : [parts];
		const text = partsArray.map((p) => p.text || "").join("");

		this.session.sendClientContent({
			turns: text,
			turnComplete,
		});
		this.log("client.send", text);
	}
}
