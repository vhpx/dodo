"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	motion,
	useMotionTemplate,
	useMotionValue,
	useSpring,
	useTransform,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveAPIProvider, useLiveAPIContext } from "../hooks/use-live-api";
import { AudioRecorder } from "./audio/audio-recorder";
import { Altair } from "./components/altair/component";
import { ChatBox } from "./components/chat-box/chat-box";
import ControlTray from "./components/control-tray/control-tray";
import UsedTools from "./components/tools/used-tools";

function useAudioRecorder() {
	const [isUserSpeaking, setIsUserSpeaking] = useState(false);
	const recorderRef = useRef<AudioRecorder | null>(null);

	// Initialize recorder only on client side
	useEffect(() => {
		if (typeof window !== "undefined") {
			recorderRef.current = new AudioRecorder();

			return () => {
				recorderRef.current?.stop();
			};
		}
	}, []);

	// Handle volume changes
	useEffect(() => {
		const recorder = recorderRef.current;
		if (!recorder) return;

		const handleVolume = (volume: number) => {
			setIsUserSpeaking(volume > 0.1);
		};

		recorder.on("volume", handleVolume);
		return () => {
			recorder.off("volume", handleVolume);
		};
	}, []);

	return { isUserSpeaking, recorder: recorderRef.current };
}

type AssistantAudioBlobProps = {
	connected: boolean;
	volume: number;
	currentTranscript: string;
	messages: Array<{ role: "user" | "assistant"; content: string }>;
	isUserSpeaking: boolean;
};

function AssistantAudioBlob({
	connected,
	volume,
	currentTranscript,
	messages,
	isUserSpeaking,
}: AssistantAudioBlobProps) {
	const gpuStyle = useMemo(
		() => ({
			willChange: "transform, opacity",
			backfaceVisibility: "hidden" as const,
		}),
		[],
	);
	const amplitude = useMotionValue(0);
	const amplitudeSpring = useSpring(amplitude, {
		stiffness: 200,
		damping: 28,
		mass: 0.6,
	});
	const blobScale = useTransform(
		amplitudeSpring,
		(value) => 0.85 + value * 0.55,
	);
	const blobOpacity = useTransform(amplitudeSpring, (value) =>
		Math.min(0.75, 0.35 + value * 0.6),
	);
	const blobRotate = useTransform(amplitudeSpring, (value) => -14 + value * 36);
	const haloScale = useTransform(amplitudeSpring, (value) => 1.4 + value * 0.4);
	const haloOpacity = useTransform(amplitudeSpring, (value) =>
		Math.min(0.55, 0.25 + value * 0.55),
	);
	const ringScale = useTransform(amplitudeSpring, (value) => 1.2 + value * 0.4);
	const parallaxScale = useTransform(
		amplitudeSpring,
		(value) => 1.05 + value * 0.2,
	);
	const shimmerOpacity = useTransform(amplitudeSpring, (value) =>
		Math.min(0.45, 0.15 + value * 0.4),
	);
	const companionGlow = useTransform(amplitudeSpring, (value) =>
		Math.min(0.32, 0.14 + value * 0.26),
	);
	const anchorGlow = useTransform(amplitudeSpring, (value) =>
		Math.min(0.38, 0.18 + value * 0.28),
	);
	const baseAuroraOpacity = useTransform(amplitudeSpring, (value) =>
		Math.min(0.75, 0.28 + value * 0.55),
	);
	const idlePulse = useTransform(
		amplitudeSpring,
		(value) => 0.9 + value * 0.12,
	);
	const idleDrift = useTransform(
		amplitudeSpring,
		(value) => (value - 0.4) * 60,
	);
	const idleSway = useTransform(
		amplitudeSpring,
		(value) => (value - 0.35) * 90,
	);
	const huePrimary = useTransform(amplitudeSpring, (value) => 210 + value * 80);
	const hueSecondary = useTransform(
		amplitudeSpring,
		(value) => 295 + value * 60,
	);
	const hueTertiary = useTransform(
		amplitudeSpring,
		(value) => 165 + value * 50,
	);
	const auroraHue = useTransform(amplitudeSpring, (value) => 190 + value * 45);
	const dynamicBlobGradient = useMotionTemplate`radial-gradient(circle at 30% 25%, hsl(${huePrimary} 92% 62% / 0.55), transparent 60%), radial-gradient(circle at 70% 30%, hsl(${hueSecondary} 95% 65% / 0.52), transparent 58%), radial-gradient(circle at 50% 80%, hsl(${hueTertiary} 88% 58% / 0.5), transparent 60%)`;
	const innerGlowGradient = useMotionTemplate`radial-gradient(circle at 50% 50%, hsl(${huePrimary} 100% 95% / 0.25), transparent 65%)`;
	const auroraGradient = useMotionTemplate`conic-gradient(from 120deg at 50% 50%, hsl(${auroraHue} 90% 64% / 0.25), transparent 45%, hsl(${hueSecondary} 88% 70% / 0.18), transparent 75%)`;
	const ribbonGradient = useMotionTemplate`linear-gradient(135deg, hsl(${huePrimary} 95% 68% / 0.27) 0%, transparent 35%, hsl(${hueTertiary} 90% 60% / 0.24) 65%, transparent 100%)`;

	const particleConfigs = useMemo(
		() => [
			{ id: "p-top-left", x: "8%", y: "12%", size: "140px", delay: 0.2 },
			{ id: "p-top-right", x: "78%", y: "18%", size: "120px", delay: 0.8 },
			{ id: "p-bottom-left", x: "15%", y: "72%", size: "160px", delay: 1.4 },
			{ id: "p-bottom-right", x: "72%", y: "68%", size: "130px", delay: 2.1 },
			{ id: "p-center", x: "48%", y: "48%", size: "220px", delay: 0.6 },
			{ id: "p-far", x: "92%", y: "40%", size: "110px", delay: 2.8 },
			{ id: "p-mid-1", x: "35%", y: "22%", size: "150px", delay: 1.1 },
			{ id: "p-mid-2", x: "60%", y: "78%", size: "140px", delay: 1.7 },
			{ id: "p-mid-3", x: "28%", y: "56%", size: "130px", delay: 2.3 },
			{ id: "p-mid-4", x: "82%", y: "50%", size: "125px", delay: 2.9 },
			{ id: "p-near-1", x: "10%", y: "38%", size: "120px", delay: 0.9 },
			{ id: "p-near-2", x: "88%", y: "72%", size: "115px", delay: 1.5 },
		],
		[],
	);

	const shimmerSparkles = useMemo(
		() => [
			{ id: "s-1", x: "20%", y: "25%", delay: 0.5 },
			{ id: "s-2", x: "65%", y: "30%", delay: 1.8 },
			{ id: "s-3", x: "38%", y: "70%", delay: 2.6 },
			{ id: "s-4", x: "82%", y: "58%", delay: 3.4 },
			{ id: "s-5", x: "12%", y: "48%", delay: 4.1 },
			{ id: "s-6", x: "50%", y: "18%", delay: 2.2 },
			{ id: "s-7", x: "30%", y: "42%", delay: 1.2 },
			{ id: "s-8", x: "72%", y: "22%", delay: 2.0 },
			{ id: "s-9", x: "44%", y: "12%", delay: 2.8 },
			{ id: "s-10", x: "8%", y: "66%", delay: 3.1 },
			{ id: "s-11", x: "90%", y: "52%", delay: 3.6 },
		],
		[],
	);

	useEffect(() => {
		const ambientFloor = connected ? 0.28 : 0.18;
		const transcriptLift = currentTranscript ? 0.32 : connected ? 0.12 : 0.06;
		const speakingBoost = isUserSpeaking ? 0.25 : 0;
		const dynamicBoost = volume * 8.2 + transcriptLift + speakingBoost;
		const target = Math.min(1.2, Math.max(ambientFloor, dynamicBoost));
		amplitude.set(target);
	}, [connected, volume, amplitude, currentTranscript, isUserSpeaking]);

	const lastAssistantMessage = useMemo(() => {
		return [...messages]
			.reverse()
			.find((message) => message.role === "assistant")?.content;
	}, [messages]);

	const headline = !connected
		? "Connect to begin the session"
		: currentTranscript.trim()
			? currentTranscript
			: (lastAssistantMessage ?? "Waiting for the assistant to respond…");

	return (
		<div className="relative flex h-full w-full flex-1 items-center justify-center overflow-visible bg-gradient-to-br from-background via-background/80 to-muted/40 px-0 py-0 text-foreground isolate">
			<motion.div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={gpuStyle}
				animate={{ opacity: connected ? 0.4 : 0.25 }}
				transition={{ duration: 0.6, ease: "easeInOut" }}
			>
				<div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
				<div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-secondary/10 via-transparent to-transparent" />
				<motion.span
					className="absolute left-1/2 top-6 -translate-x-1/2 h-24 w-[60%] rounded-full blur-3xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.28), transparent 65%)",
					}}
					animate={{ opacity: [0.35, 0.6, 0.35], y: [0, -4, 0] }}
					transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
				/>
				<motion.span
					className="absolute left-[12%] top-10 h-20 w-56 rounded-full blur-2xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.26), transparent 70%)",
					}}
					animate={{ opacity: [0.25, 0.5, 0.25], y: [0, -6, 0] }}
					transition={{
						duration: 7.5,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 0.8,
					}}
				/>
				<motion.span
					className="absolute right-[12%] top-12 h-16 w-48 rounded-full blur-2xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--muted) / 0.24), transparent 70%)",
					}}
					animate={{ opacity: [0.22, 0.45, 0.22], y: [0, -5, 0] }}
					transition={{
						duration: 7,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1.6,
					}}
				/>

				<motion.span
					className="absolute left-1/2 bottom-8 -translate-x-1/2 h-28 w-[62%] rounded-full blur-3xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.24), transparent 65%)",
					}}
					animate={{ opacity: [0.32, 0.58, 0.32], y: [0, 6, 0] }}
					transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
				/>
				<motion.span
					className="absolute left-[14%] bottom-12 h-16 w-48 rounded-full blur-2xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--secondary) / 0.22), transparent 70%)",
					}}
					animate={{ opacity: [0.2, 0.42, 0.2], y: [0, 5, 0] }}
					transition={{
						duration: 7.2,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 0.6,
					}}
				/>
				<motion.span
					className="absolute right-[14%] bottom-10 h-20 w-56 rounded-full blur-2xl"
					style={{
						...gpuStyle,
						background:
							"radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.24), transparent 70%)",
					}}
					animate={{ opacity: [0.22, 0.5, 0.22], y: [0, 4, 0] }}
					transition={{
						duration: 7.8,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 1.2,
					}}
				/>
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute aspect-square w-[70vmin] max-w-[560px]"
				style={{ ...gpuStyle, scale: haloScale, opacity: haloOpacity }}
				animate={{ rotate: [0, 35, -24, 0] }}
				transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
			>
				<span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.35),transparent_65%)] blur-3xl opacity-80" />
				<span className="absolute inset-0 rounded-[44%] bg-[conic-gradient(from_120deg_at_50%_50%,rgba(59,130,246,0.4),rgba(74,222,128,0.3),rgba(244,114,182,0.35),rgba(59,130,246,0.4))] blur-2xl opacity-75 mix-blend-screen" />
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute aspect-square w-[80vmin] max-w-[640px]"
				style={{ ...gpuStyle, scale: parallaxScale, opacity: shimmerOpacity }}
				animate={{ rotate: [-12, 28, -18, 14, -12] }}
				transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
			>
				<span className="absolute inset-0 rounded-[46%] bg-[conic-gradient(from_60deg_at_50%_50%,rgba(236,72,153,0.35),rgba(14,165,233,0.28),rgba(168,85,247,0.4),rgba(34,197,94,0.32),rgba(236,72,153,0.35))] blur-[110px] opacity-90 mix-blend-screen" />
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{
					...gpuStyle,
					opacity: baseAuroraOpacity,
					scale: idlePulse,
					x: idleSway,
					y: idleDrift,
				}}
				animate={{ rotate: [-6, 10, -4, 7, -6] }}
				transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
			>
				<motion.span
					className="absolute inset-[-18%] rounded-[50%] blur-[120px]"
					style={{ ...gpuStyle, background: auroraGradient }}
				/>
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{ ...gpuStyle, x: idleSway, y: idleDrift }}
				animate={{ rotate: [4, -8, 6, -4, 4] }}
				transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
			>
				<motion.span
					className="absolute left-[15%] top-1/4 h-[320px] w-[480px] rounded-full blur-[90px]"
					style={{ ...gpuStyle, background: ribbonGradient, opacity: 0.5 }}
				/>
				<motion.span
					className="absolute right-[12%] bottom-1/5 h-[280px] w-[420px] rounded-full blur-[110px]"
					style={{ ...gpuStyle, background: ribbonGradient, opacity: 0.4 }}
				/>
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute right-[12%] top-[14%] h-64 w-64 rounded-full border border-white/10"
				style={{ ...gpuStyle, opacity: companionGlow }}
				animate={{ y: [-18, 12, -14], rotate: [0, 12, -8, 0] }}
				transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
			>
				<span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.25),transparent_70%)] blur-3xl" />
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute left-[10%] bottom-[12%] h-72 w-72 rounded-full border border-white/10"
				style={{ ...gpuStyle, opacity: anchorGlow }}
				animate={{
					y: [14, -10, 16],
					rotate: [0, -10, 6, -4, 0],
					scale: [0.9, 1.05, 0.92],
				}}
				transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
			>
				<span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_60%_60%,rgba(16,185,129,0.22),transparent_70%)] blur-2xl" />
			</motion.div>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute aspect-square w-[52vmin] max-w-[480px]"
				style={{
					...gpuStyle,
					scale: blobScale,
					opacity: blobOpacity,
					rotate: blobRotate,
				}}
				animate={{
					borderRadius: [
						"48% 52% 58% 42%",
						"56% 44% 46% 54%",
						"42% 58% 60% 40%",
						"50% 50% 46% 54%",
						"48% 52% 58% 42%",
					],
				}}
				transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
			>
				<motion.span
					className="absolute inset-0 rounded-[inherit] blur-2xl opacity-95 mix-blend-screen"
					style={{ ...gpuStyle, background: dynamicBlobGradient }}
				/>
				<motion.span
					className="absolute inset-[16%] rounded-[inherit] blur-xl opacity-80"
					style={{ ...gpuStyle, background: innerGlowGradient }}
				/>
			</motion.div>

			<motion.ul
				aria-hidden
				className="pointer-events-none absolute inset-0 list-none"
				style={gpuStyle}
			>
				{particleConfigs.map(({ id, x, y, size, delay }) => (
					<motion.li
						key={id}
						className="absolute rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.35),transparent_70%)] blur-3xl"
						style={{
							...gpuStyle,
							top: y,
							left: x,
							width: size,
							height: size,
							opacity: 0.35,
						}}
						animate={{
							opacity: [0.15, 0.55, 0.2],
							scale: [0.6, 1.1, 0.65],
							rotate: [-12, 18, -6],
						}}
						transition={{
							duration: 7.5 + delay,
							repeat: Infinity,
							ease: "easeInOut",
							delay,
						}}
					/>
				))}
			</motion.ul>

			<motion.ul
				aria-hidden
				className="pointer-events-none absolute inset-0 list-none"
				style={gpuStyle}
			>
				{shimmerSparkles.map(({ id, x, y, delay }) => (
					<motion.li
						key={id}
						className="absolute h-2 w-2 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.85)]"
						style={{ ...gpuStyle, left: x, top: y }}
						animate={{
							opacity: [0, 1, 0.2, 0.85, 0],
							scale: [0.8, 1.6, 0.9, 1.4, 0.8],
						}}
						transition={{
							duration: 4.8,
							repeat: Infinity,
							ease: "easeInOut",
							delay,
						}}
					/>
				))}
			</motion.ul>

			<motion.div
				aria-hidden
				className="pointer-events-none absolute aspect-square w-[36vmin] max-w-[320px] rounded-full"
				style={{ ...gpuStyle, scale: ringScale }}
				animate={{
					opacity: isUserSpeaking ? [0.4, 0.8, 0.4] : [0.15, 0.3, 0.15],
				}}
				transition={{
					duration: isUserSpeaking ? 1.6 : 3.4,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>

			<div className="relative z-10 flex max-w-lg flex-col items-center gap-6 text-center">
				{!connected && (
					<>
						<motion.span
							className="flex items-center gap-2 text-xs uppercase tracking-[0.5em] text-muted-foreground"
							animate={{ opacity: connected ? 0.22 : 0.6 }}
						>
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
							{connected ? "Assistant channel live" : "Awaiting connection"}
						</motion.span>
						<motion.p
							key={headline}
							className="text-3xl font-semibold leading-snug text-foreground"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
						>
							{headline}
						</motion.p>
					</>
				)}
			</div>
		</div>
	);
}

function ChatApp() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [initialized, setInitialized] = useState(false);
	const [showAssistant] = useState(true);
	const [textChatOpen, setTextChatOpen] = useState(false);
	const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
	const [messages, setMessages] = useState<
		Array<{ role: "user" | "assistant"; content: string }>
	>([]);
	const [currentTranscript, setCurrentTranscript] = useState<string>("");
	const transcriptRef = useRef<string>("");
	const { client, connected, volume } = useLiveAPIContext();
	const { isUserSpeaking } = useAudioRecorder();

	// Keep the ref in sync with transcript state.
	useEffect(() => {
		transcriptRef.current = currentTranscript;
	}, [currentTranscript]);

	// Finalize transcript, and if empty, push a fallback message.
	const finalizeTranscript = useCallback(() => {
		if (transcriptRef.current && transcriptRef.current.trim() !== "") {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: transcriptRef.current },
			]);
		} else {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: "[No text response, only audio output]" },
			]);
		}
		setCurrentTranscript("");
	}, []);

	// Handle partial responses – accumulate text parts.
	useEffect(() => {
		if (!client) return;
		const handleContent = (content: any) => {
			if (content?.modelTurn?.parts && Array.isArray(content.modelTurn.parts)) {
				const text = content.modelTurn.parts
					.filter((part: any) => typeof part.text === "string")
					.map((part: any) => part.text)
					.join("");
				if (text) {
					// Append text to running transcript.
					setCurrentTranscript((prev) => prev + text);
				}
			}
		};

		client.on("content", handleContent);
		client.on("turncomplete", finalizeTranscript);
		client.on("setupcomplete", () => console.log("Setup complete"));
		client.on("error", (err) => console.error("Client error:", err));

		return () => {
			client.off("content", handleContent);
			client.off("turncomplete", finalizeTranscript);
			client.off("setupcomplete");
			client.off("error");
		};
	}, [client, finalizeTranscript]);

	useEffect(() => {
		setInitialized(true);
	}, []);

	// Auto-close text chat when disconnecting
	useEffect(() => {
		if (!connected && textChatOpen) {
			setTextChatOpen(false);
		}
	}, [connected, textChatOpen]);

	useEffect(() => {
		if (!videoStream && videoRef.current) {
			videoRef.current.srcObject = null;
		}
		if (videoStream) {
			const handleTrackEnded = () => {
				setVideoStream(null);
			};
			videoStream.getVideoTracks().forEach((track) => {
				track.addEventListener("ended", handleTrackEnded);
			});
			return () => {
				videoStream.getVideoTracks().forEach((track) => {
					track.removeEventListener("ended", handleTrackEnded);
					track.stop();
				});
				setVideoStream(null);
			};
		}
	}, [videoStream]);

	return (
		<div className="flex h-screen">
			<main className="flex flex-1">
				{/* Chat Area */}
				<div className="flex min-w-0 flex-1 flex-col -ml-14">
					{/* Messages Area */}
					<div className="flex-1 overflow-hidden">
						<div className="mx-auto flex h-full items-center justify-center">
							{showAssistant ? (
								<AssistantAudioBlob
									connected={connected}
									volume={volume}
									currentTranscript={currentTranscript}
									messages={messages}
									isUserSpeaking={isUserSpeaking}
								/>
							) : (
								<div className="relative flex w-full items-center justify-center">
									<div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-6 py-5 shadow-sm">
										<span
											className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
											aria-hidden
										/>
										<span className="text-sm text-muted-foreground">
											Preparing assistant…
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
					{/* Controls and Input */}
					{initialized && (
						<div className="flex-none fixed bottom-8 inset-x-0 space-y-4 p-6">
							<div className="mx-auto max-w-3xl flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<UsedTools />
									{/* Compact toggle moved into ControlTray */}
								</div>
								<ControlTray
									videoRef={videoRef}
									supportsVideo={true}
									onVideoStreamChange={setVideoStream}
									textChatOpen={textChatOpen}
									onToggleChat={() => setTextChatOpen((v) => !v)}
								/>
								{textChatOpen && (
									<div className="rounded-xl border border-border/60 bg-card/50 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/40">
										<ChatBox
											connected={connected}
											disabled={!connected}
											onSubmit={async (text: string) => {
												try {
													setMessages((prev) => [
														...prev,
														{ role: "user", content: text },
													]);
													client.send({ text }, true);
												} catch (e) {
													console.error(e);
												}
											}}
										/>
									</div>
								)}
							</div>
						</div>
					)}
					{/* Altair insight trigger and dialog */}
					<Altair />
				</div>
			</main>
		</div>
	);
}

export default function App() {
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [keyInput, setKeyInput] = useState<string>("");
	const [checkedStorage, setCheckedStorage] = useState<boolean>(false);

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

	const handleSaveKey = useCallback(() => {
		const trimmed = keyInput.trim();
		if (!trimmed) return;
		try {
			window.localStorage.setItem("gemini_api_key", trimmed);
			setApiKey(trimmed);
			setKeyInput("");
		} catch {}
	}, [keyInput]);

	// Loading state while checking for existing key in localStorage
	if (!checkedStorage) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-background text-foreground px-6">
				<div className="w-full max-w-md rounded-xl border border-border bg-card/60 p-6 shadow-xl">
					<div className="flex items-center gap-3">
						<span
							className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
							aria-hidden
						/>
						<span className="text-sm text-muted-foreground">
							Checking saved key…
						</span>
					</div>
				</div>
			</div>
		);
	}

	if (!apiKey) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-background text-foreground px-6">
				<div className="w-full max-w-md rounded-xl border border-border bg-card/60 p-6 shadow-xl">
					<h1 className="text-lg font-semibold text-card-foreground">
						Enter Gemini API Key
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Provide your Google Gemini API key to start a voice session. The key
						is stored locally and cannot be viewed later.
					</p>
					<div className="mt-4 flex items-center gap-2">
						<Input
							type="password"
							placeholder="AIza..."
							value={keyInput}
							onChange={(e) => setKeyInput(e.target.value)}
							className="bg-background text-foreground placeholder:text-muted-foreground"
							aria-label="Gemini API key"
						/>
						<Button onClick={handleSaveKey} disabled={!keyInput.trim()}>
							Save key
						</Button>
					</div>
					<p className="mt-3 text-xs text-muted-foreground">
						Tip: You can rotate the key anytime by clearing site data in your
						browser.
					</p>
				</div>
			</div>
		);
	}

	const host = "generativelanguage.googleapis.com";
	const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

	return (
		<LiveAPIProvider url={uri} apiKey={apiKey}>
			<ChatApp />
		</LiveAPIProvider>
	);
}
