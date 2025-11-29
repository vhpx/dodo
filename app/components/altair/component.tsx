"use client";

import type { ToolCall } from "@/app/multimodal-live";
import { useLiveAPIContext } from "@/hooks/use-live-api";
import { usePrediction } from "@/hooks/use-prediction";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const declaration: FunctionDeclaration = {
	name: "render_altair",
	description: "Displays an altair graph in json format.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			json_graph: {
				type: SchemaType.STRING,
				description:
					"JSON STRING representation of the graph to render. Must be a string, not a json object",
			},
		},
		required: ["json_graph"],
	},
};

const fetchPredictionDeclaration: FunctionDeclaration = {
	name: "fetch_prediction",
	description:
		"Fetches the latest 3-day trend prediction for a given S&P 500 ticker from the FinVision backend.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			ticker: {
				type: SchemaType.STRING,
				description:
					"The stock ticker symbol (S&P 500 only). Example: AAPL, NVDA, GOOGL",
			},
		},
		required: ["ticker"],
	},
};

const fetchCompaniesForPortfolioDeclaration: FunctionDeclaration = {
	name: "fetch_companies_for_portfolio",
	description:
		"Returns candidate companies for a portfolio based on centroid-matching KPIs.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			portfolioId: {
				type: SchemaType.STRING,
				description: "The portfolio ID to compute matching companies for.",
			},
			limit: {
				type: SchemaType.NUMBER,
				description:
					"Optional maximum number of companies to return, default 10.",
			},
		},
		required: ["portfolioId"],
	},
};

const fetchPortfolioDeclaration: FunctionDeclaration = {
	name: "fetch_portfolio",
	description: "Fetches a portfolio by id including its stored attributes.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			portfolioId: {
				type: SchemaType.STRING,
				description: "The portfolio ID to fetch.",
			},
		},
		required: ["portfolioId"],
	},
};

const fetchPortfolioStocksDeclaration: FunctionDeclaration = {
	name: "fetch_portfolio_stocks",
	description: "Fetches enriched stocks currently in the portfolio.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {
			portfolioId: {
				type: SchemaType.STRING,
				description: "The portfolio ID whose stocks to fetch.",
			},
		},
		required: ["portfolioId"],
	},
};

const fetchUserPortfoliosDeclaration: FunctionDeclaration = {
	name: "fetch_user_portfolios",
	description:
		"Fetches all portfolios owned by the currently authenticated user.",
	parameters: {
		type: SchemaType.OBJECT,
		properties: {},
	},
};

function AltairComponent() {
	const [, setJSONString] = useState<string>("");
	const [specObject, setSpecObject] = useState<any | null>(null);
	const [, setRendering] = useState<boolean>(false);
	const [open, setOpen] = useState<boolean>(false);
	const [pendingPrediction, setPendingPrediction] = useState<{
		ticker: string;
		functionId: string;
	} | null>(null);
	const { client, setConfig } = useLiveAPIContext();

	// Use React Query for prediction fetching
	const { data: prediction, error: predictionError } = usePrediction(
		pendingPrediction?.ticker ?? null,
		{ enabled: Boolean(pendingPrediction?.ticker) },
	);

	// Handle prediction response
	useEffect(() => {
		if (!pendingPrediction) return;

		if (prediction) {
			// Success: send prediction data back to the client
			client.sendToolResponse({
				functionResponses: [
					{
						id: pendingPrediction.functionId,
						response: {
							ok: true,
							status: 200,
							body: {
								message: "Prediction successful",
								statusCode: 200,
								data: {
									ticker: prediction.ticker,
									confidence_score: prediction.confidence,
									prediction: {
										result: prediction.result,
										bearish: prediction.bearish,
										neutral: prediction.neutral,
										bullish: prediction.bullish,
									},
								},
							},
						},
					},
				],
			});
			toast.message("Prediction tool called", {
				description: `Ticker ${pendingPrediction.ticker.toUpperCase()} • success`,
			});
			setPendingPrediction(null);
		} else if (predictionError) {
			// Error: send error response back to the client
			client.sendToolResponse({
				functionResponses: [
					{
						id: pendingPrediction.functionId,
						response: {
							ok: false,
							error: predictionError.message || "Failed to fetch prediction",
						},
					},
				],
			});
			toast.error(
				`Prediction failed for ${pendingPrediction.ticker.toUpperCase()}`,
			);
			setPendingPrediction(null);
		}
	}, [prediction, predictionError, pendingPrediction, client]);

	useEffect(() => {
		setConfig({
			// Use Gemini 2.5 Flash Native Audio for better voice experience
			model: "gemini-2.5-flash-native-audio-preview-09-2025",
			generationConfig: {
				responseModalities: "audio",
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: "Aoede" },
					},
				},
				// Enable affective dialog for more expressive, emotionally engaging responses
				enableAffectiveDialog: true,
			},
			systemInstruction: {
				parts: [
					{
						text: `You are an immersive Game Master for "Voice Escape" - a voice-based escape room game where players use their voice and wit to solve AI-generated scenarios.

GAME OVERVIEW:
- Players are placed in challenging scenarios (survival, mystery, puzzle, social themes)
- They must use creative thinking and dialogue to escape
- You evaluate their attempts and guide the narrative

YOUR ROLE AS GAME MASTER:
1. Set immersive scenes with vivid descriptions
2. Respond to player actions dynamically and in-character
3. Use the evaluate_escape_attempt tool when players take significant actions
4. Provide subtle hints if players are stuck (in-character)
5. Celebrate victories and encourage retries on defeats

VOICE PERFORMANCE:
- Match your tone to the scenario theme:
  • Survival: Urgent, tense, sense of danger
  • Mystery: Contemplative, intriguing, enigmatic
  • Puzzle: Curious, playful, appreciative of clever solutions
  • Social: Emotionally nuanced, perceptive
- Use verbal sound effects: *crash*, *whisper*, *footsteps approaching*
- Vary pacing for dramatic effect

INTERACTION GUIDELINES:
- Keep responses to 2-4 sentences unless setting a scene
- Address players in second person ("You notice...", "Your heart races...")
- Always leave something for the player to respond to
- Accept creative solutions that fit the scenario logic
- Be fair but challenging - require genuine problem-solving

When not in an active scenario, help players navigate the game, explain features, or encourage them to start a new adventure!`,
					},
				],
			},
			tools: [
				// there is a free-tier quota for search
				{ googleSearch: {} },
				{
					functionDeclarations: [
						declaration,
						fetchPredictionDeclaration,
						fetchCompaniesForPortfolioDeclaration,
						fetchPortfolioDeclaration,
						fetchPortfolioStocksDeclaration,
						fetchUserPortfoliosDeclaration,
					],
				},
			],
		});
	}, [setConfig]);

	useEffect(() => {
		const onToolCall = async (toolCall: ToolCall) => {
			const fc = toolCall.functionCalls.find(
				(fc) => fc.name === declaration.name,
			);
			if (fc) {
				const str = (fc.args as { json_graph: string }).json_graph;
				setJSONString(str);
				try {
					const parsed = JSON.parse(str);
					setSpecObject(parsed);
				} catch {
					// If parsing fails here, still allow dialog to open and show error later
				}
				setOpen(true);
			}

			// Handle fetch_prediction function call
			const predictionFc = toolCall.functionCalls.find(
				(call) => call.name === fetchPredictionDeclaration.name,
			);

			if (predictionFc) {
				const { ticker } = predictionFc.args as { ticker: string };
				const cleanTicker = String(ticker || "").trim();

				if (!cleanTicker) {
					await client.sendToolResponse({
						functionResponses: [
							{
								id: predictionFc.id,
								response: { ok: false, error: "Ticker is required" },
							},
						],
					});
					return;
				}

				// Set pending prediction to trigger React Query fetch
				setPendingPrediction({
					ticker: cleanTicker,
					functionId: predictionFc.id,
				});
			}

			// Handle fetch_companies_for_portfolio
			const companiesFc = toolCall.functionCalls.find(
				(call) => call.name === fetchCompaniesForPortfolioDeclaration.name,
			);
			if (companiesFc) {
				const { portfolioId, limit } = companiesFc.args as {
					portfolioId: string;
					limit?: number;
				};
				try {
					const qs = new URLSearchParams({ portfolioId: String(portfolioId) });
					if (typeof limit === "number" && Number.isFinite(limit)) {
						qs.set("limit", String(limit));
					}
					const resp = await fetch(`/api/companies?${qs.toString()}`);
					const json = await resp.json();
					toast.message("Companies tool called", {
						description: `Portfolio ${String(portfolioId).slice(0, 10)}${
							typeof limit === "number" ? ` • limit ${limit}` : ""
						}`,
					});
					await client.sendToolResponse({
						functionResponses: [
							{
								id: companiesFc.id,
								response: { ok: true, status: resp.status, body: json },
							},
						],
					});
				} catch (_) {
					toast.error("Companies fetch failed");
					await client.sendToolResponse({
						functionResponses: [
							{
								id: companiesFc.id,
								response: { ok: false, error: "Failed to fetch companies" },
							},
						],
					});
				}
			}

			// Handle fetch_portfolio
			const portfolioFc = toolCall.functionCalls.find(
				(call) => call.name === fetchPortfolioDeclaration.name,
			);
			if (portfolioFc) {
				const { portfolioId } = portfolioFc.args as { portfolioId?: string };
				// Auto-fallback: if portfolioId missing, fetch user portfolios first and surface selection
				if (!portfolioId) {
					try {
						const listResp = await fetch(`/api/portfolio`);
						const listJson = await listResp.json();
						toast.message("Portfolio tool called", {
							description: "Missing portfolioId; returning user portfolios",
						});
						await client.sendToolResponse({
							functionResponses: [
								{
									id: portfolioFc.id,
									response: {
										ok: false,
										needsPortfolioSelection: true,
										portfolios: listJson?.data ?? [],
									},
								},
							],
						});
						return;
					} catch (_) {
						await client.sendToolResponse({
							functionResponses: [
								{
									id: portfolioFc.id,
									response: {
										ok: false,
										error:
											"Missing portfolioId and failed to fetch user portfolios",
									},
								},
							],
						});
						return;
					}
				}
				try {
					const resp = await fetch(
						`/api/portfolio?portfolioId=${encodeURIComponent(String(portfolioId))}`,
					);
					const json = await resp.json();
					toast.message("Portfolio tool called", {
						description: `Portfolio ${String(portfolioId).slice(0, 10)}`,
					});
					await client.sendToolResponse({
						functionResponses: [
							{
								id: portfolioFc.id,
								response: { ok: true, status: resp.status, body: json },
							},
						],
					});
				} catch (_) {
					toast.error("Portfolio fetch failed");
					await client.sendToolResponse({
						functionResponses: [
							{
								id: portfolioFc.id,
								response: { ok: false, error: "Failed to fetch portfolio" },
							},
						],
					});
				}
			}

			// Handle fetch_portfolio_stocks
			const portfolioStocksFc = toolCall.functionCalls.find(
				(call) => call.name === fetchPortfolioStocksDeclaration.name,
			);
			if (portfolioStocksFc) {
				const { portfolioId } = portfolioStocksFc.args as {
					portfolioId?: string;
				};
				if (!portfolioId) {
					try {
						const listResp = await fetch(`/api/portfolio`);
						const listJson = await listResp.json();
						toast.message("Portfolio stocks tool called", {
							description: "Missing portfolioId; returning user portfolios",
						});
						await client.sendToolResponse({
							functionResponses: [
								{
									id: portfolioStocksFc.id,
									response: {
										ok: false,
										needsPortfolioSelection: true,
										portfolios: listJson?.data ?? [],
									},
								},
							],
						});
						return;
					} catch (_) {
						await client.sendToolResponse({
							functionResponses: [
								{
									id: portfolioStocksFc.id,
									response: {
										ok: false,
										error:
											"Missing portfolioId and failed to fetch user portfolios",
									},
								},
							],
						});
						return;
					}
				}
				try {
					const resp = await fetch(
						`/api/portfolio/stocks?portfolioId=${encodeURIComponent(String(portfolioId))}`,
					);
					const json = await resp.json();
					toast.message("Portfolio stocks tool called", {
						description: `Portfolio ${String(portfolioId).slice(0, 10)}`,
					});
					await client.sendToolResponse({
						functionResponses: [
							{
								id: portfolioStocksFc.id,
								response: { ok: true, status: resp.status, body: json },
							},
						],
					});
				} catch (_) {
					toast.error("Portfolio stocks fetch failed");
					await client.sendToolResponse({
						functionResponses: [
							{
								id: portfolioStocksFc.id,
								response: {
									ok: false,
									error: "Failed to fetch portfolio stocks",
								},
							},
						],
					});
				}
			}

			// Handle fetch_user_portfolios
			const userPortfoliosFc = toolCall.functionCalls.find(
				(call) => call.name === fetchUserPortfoliosDeclaration.name,
			);
			if (userPortfoliosFc) {
				try {
					const resp = await fetch(`/api/portfolio`);
					const json = await resp.json();
					toast.message("User portfolios tool called");
					await client.sendToolResponse({
						functionResponses: [
							{
								id: userPortfoliosFc.id,
								response: { ok: true, status: resp.status, body: json },
							},
						],
					});
				} catch (_) {
					toast.error("User portfolios fetch failed");
					await client.sendToolResponse({
						functionResponses: [
							{
								id: userPortfoliosFc.id,
								response: {
									ok: false,
									error: "Failed to fetch user portfolios",
								},
							},
						],
					});
				}
			}

			// Acknowledge any remaining function calls if not handled above
			const remaining = toolCall.functionCalls.filter(
				(call) =>
					call.name !== fetchPredictionDeclaration.name &&
					call.name !== fetchCompaniesForPortfolioDeclaration.name &&
					call.name !== fetchPortfolioDeclaration.name &&
					call.name !== fetchPortfolioStocksDeclaration.name &&
					call.name !== fetchUserPortfoliosDeclaration.name,
			);
			if (remaining.length) {
				await client.sendToolResponse({
					functionResponses: remaining.map((call) => ({
						id: call.id,
						response: { success: true },
					})),
				});
			}
		};
		client.on("toolcall", onToolCall);
		return () => {
			client.off("toolcall", onToolCall);
		};
	}, [client]);

	const embedRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const loadVegaEmbed = async () => {
			if (!embedRef.current || !open || !specObject) return;
			setRendering(true);
			try {
				const vegaEmbed = (await import("vega-embed")).default;
				await vegaEmbed(embedRef.current, specObject, {
					actions: false,
					renderer: "canvas",
				});
			} catch {
				toast.error("Failed to render insight. Invalid chart specification.");
			} finally {
				setRendering(false);
			}
		};

		loadVegaEmbed();
	}, [open, specObject]);

	// const handleOpenChange = (next: boolean) => {
	//   setOpen(next);
	// };

	return null;

	// return (
	//   <Dialog open={open} onOpenChange={handleOpenChange}>
	//     {/* <DialogTrigger asChild>
	//       <Button
	//         aria-label="Open data insight"
	//         className="fixed bottom-28 right-6 z-50 shadow-lg"
	//         variant="secondary"
	//         size="sm"
	//       >
	//         Insight{hasNewInsight ? ' •' : ''}
	//       </Button>
	//     </DialogTrigger> */}
	//     <DialogContent className="sm:max-w-3xl">
	//       <DialogHeader>
	//         <DialogTitle>
	//           {typeof specObject?.title === 'string' && specObject.title.trim()
	//             ? specObject.title
	//             : 'Kitto Insight'}
	//         </DialogTitle>
	//         <DialogDescription>
	//           Visualization rendered by the assistant using an Altair/Vega-Lite
	//           specification.
	//         </DialogDescription>
	//       </DialogHeader>
	//       <div className="mt-2 space-y-3">
	//         <div className="flex items-center gap-2">
	//           <Button
	//             variant="outline"
	//             size="sm"
	//             aria-label="Copy specification"
	//             onClick={async () => {
	//               try {
	//                 await navigator.clipboard.writeText(jsonString || '');
	//                 toast.success('Chart spec copied');
	//               } catch {
	//                 toast.error('Copy failed');
	//               }
	//             }}
	//           >
	//             Copy JSON
	//           </Button>
	//           <Button
	//             variant="outline"
	//             size="sm"
	//             aria-label="Download PNG"
	//             onClick={async () => {
	//               try {
	//                 // Attempt to trigger vega export via a re-embed result lookup
	//                 const node = embedRef.current?.querySelector('canvas');
	//                 if (!node) throw new Error('no-canvas');
	//                 const link = document.createElement('a');
	//                 link.download = 'insight.png';
	//                 link.href = (node as HTMLCanvasElement).toDataURL(
	//                   'image/png'
	//                 );
	//                 link.click();
	//               } catch {
	//                 toast.error('Download failed');
	//               }
	//             }}
	//           >
	//             Download PNG
	//           </Button>
	//         </div>
	//         <div
	//           ref={embedRef}
	//           className="vega-embed min-h-[360px] rounded-md border border-white/10 bg-neutral-900/40"
	//         />
	//         {rendering && (
	//           <div className="absolute inset-0 flex items-center justify-center">
	//             <span className="text-sm text-neutral-300">Rendering…</span>
	//           </div>
	//         )}
	//       </div>
	//       <DialogFooter>
	//         <Button
	//           variant="outline"
	//           onClick={() => setOpen(false)}
	//           aria-label="Close insight"
	//         >
	//           Close
	//         </Button>
	//       </DialogFooter>
	//     </DialogContent>
	//   </Dialog>
	// );
}

export const Altair = AltairComponent;
