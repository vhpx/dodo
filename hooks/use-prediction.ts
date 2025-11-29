import { useQuery } from '@tanstack/react-query';

type PredictionApiResponse = {
  message: string;
  statusCode: number;
  data?: {
    ticker: string;
    confidence_score: number;
    prediction: {
      result: 'bearish' | 'neutral' | 'bullish' | string;
      bearish: number;
      neutral: number;
      bullish: number;
    };
  };
};

type TickerPrediction = {
  ticker: string;
  confidence: number; // 0..1
  result: 'bearish' | 'neutral' | 'bullish' | string;
  bearish: number; // 0..1
  neutral: number; // 0..1
  bullish: number; // 0..1
};

const fetchPrediction = async (ticker: string): Promise<TickerPrediction> => {
  const res = await fetch(
    `/api/portfolio/predict/trend?ticker=${encodeURIComponent(ticker)}`
  );
  const json: PredictionApiResponse = await res.json();

  if (!res.ok || !json?.data) {
    throw new Error(
      `Prediction failed for ${ticker}: ${json.message || 'Unknown error'}`
    );
  }

  const d = json.data;
  return {
    ticker: d.ticker,
    confidence: d.confidence_score ?? 0,
    result: d.prediction.result,
    bearish: d.prediction.bearish ?? 0,
    neutral: d.prediction.neutral ?? 0,
    bullish: d.prediction.bullish ?? 0,
  };
};

export const usePrediction = (
  ticker: string | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    retry?: boolean | number;
  }
) => {
  return useQuery({
    queryKey: ['predictions', 'trend', ticker, 'v1'],
    queryFn: () => {
      if (!ticker) throw new Error('Ticker is required');
      return fetchPrediction(ticker);
    },
    enabled: Boolean(ticker) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30 * 60 * 1000, // 30m: trends don't change frequently
    gcTime: 6 * 60 * 60 * 1000, // keep cached for session
    retry: options?.retry ?? 1,
  });
};

export const usePredictions = (
  tickers: string[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    retry?: boolean | number;
  }
) => {
  return useQuery({
    queryKey: ['predictions', 'trend', 'batch', tickers.sort(), 'v1'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        tickers.map((ticker) => fetchPrediction(ticker))
      );

      const predictions: Record<string, TickerPrediction> = {};
      const errors: Record<string, string> = {};

      results.forEach((result, index) => {
        const ticker = tickers[index];
        if (result.status === 'fulfilled') {
          predictions[ticker] = result.value;
        } else {
          errors[ticker] = result.reason?.message || 'Unknown error';
        }
      });

      return { predictions, errors };
    },
    enabled: tickers.length > 0 && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 30 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: options?.retry ?? 1,
  });
};

export type { TickerPrediction, PredictionApiResponse };
