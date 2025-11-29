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
			// Use a Live API model that supports function calling per Google docs
			// https://ai.google.dev/gemini-api/docs/live-tools
			model: "models/gemini-live-2.5-flash-preview",
			generationConfig: {
				// Prefer TEXT for reliable tool reasoning; audio can be enabled later
				responseModalities: "audio",
				// speechConfig: {
				//   voiceConfig: {
				//     prebuiltVoiceConfig: { voiceName: 'Aoede' },
				//   },
				// },
			},
			systemInstruction: {
				parts: [
					{
						text: 'System Context: FinVision Platform for AI Assistant Kitto.\n- System Name: FinVision\n- AI Assistant Name: Kitto\n- Core Purpose: Provide static, periodically refreshed AI-driven financial insights focused on interpretability for retail investors, junior analysts, and students.\n- Limitation: No real-time data; emphasize clarity, helpfulness, and transparent reasoning aligned with platform constraints.\n- Domain Guardrail: Only answer questions related to finance, markets, portfolio analysis, or trading within the scope of Kitto. Politely refuse unrelated topics and offer to help with finance/trading instead. Limit any web/search usage strictly to finance/trading contexts relevant to Kitto.\nExamples (Refuse):\n- "What\'s the price of iPhone 17?" → Out of scope.\n- "Plan my vacation to Japan" → Out of scope.\n- "Write a poem about cats" → Out of scope.\nExamples (Accept):\n- "Construct a balanced portfolio with moderate risk."\n- "Show S&P 500 sector allocation for my picks."\n- "Summarize this 10-K PDF and highlight risks."\nRefusal Template: "Sorry, I can\'t help with that topic. I can help with finance and trading—e.g., portfolio construction, market insights, or stock analysis. What would you like to explore?"\nFunctional Domains (for context): Portfolio Wizard (centroid over peRatio, operatingMarginTTM, quarterlyRevenueGrowthYoY, beta, dividendYield), LSTM 3-day trend pipeline (S&P 500 only; Tier 1: AAPL, AMZN, TSLA, NVDA, GOOGL with sentiment; Tier 2: historical only), PDF report OCR + Gemini summarization, and individual stock intelligence.\nInstruction: When a visualization is requested or helpful, call the provided function "render_altair" and pass an Altair/Vega-Lite spec as a JSON STRING (not an object). Provide your best-judgment visualization without asking for extra info unless absolutely necessary. Keep explanations concise for a dashboard UI.\nPrediction Workflow:\n- For any stock trend request, FIRST call "fetch_prediction" with the provided ticker.\n- If the API returns a non-200 status or missing data, FALL BACK to "googleSearch" to gather reputable, static sources (IR site, SEC filings, major outlets) and synthesize a qualitative, non-binding sentiment summary.\n- Clearly label search-derived insights as heuristic context (not model output), avoid numeric claims, and cite sources by name/domain.\n- Keep within S&P 500 coverage intent; if outside, respond with a gentle limitation note plus any helpful general context from search.\nTool Use Guidance:\n1) If the user asks about "my portfolios" or does not provide a portfolioId, first call "fetch_user_portfolios" with NO arguments. Present the list (most-recent first) and either pick a reasonable default (the most recent) or ask the user to choose by name — NEVER ask for a raw ID.\n2) Only call "fetch_portfolio" or "fetch_portfolio_stocks" when a specific portfolioId is known or after the user has chosen.\n3) You MAY use googleSearch for company-related performance, strategy, or comparable analyses (e.g., competitive landscape, recent strategic moves, product lines) to retrieve reputable sources (company site, investor relations, SEC filings, major outlets). Keep results concise, cite sources by name/domain, and stay within the platform\'s static (non real-time) posture.',
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
