export const DURATION_MS = 35_000;

export type Phase = "OFF" | "EXPLAIN" | "THERE" | "SEE" | "CLARITY";

export const PHASES: Array<{ phase: Phase; fromMs: number; toMs: number; text: string }> = [
  { phase: "OFF",     fromMs: 0,      toMs: 10_000, text: "Something feels off." },
  { phase: "EXPLAIN", fromMs: 10_000, toMs: 15_000, text: "You can't explain it." },
  { phase: "THERE",   fromMs: 15_000, toMs: 20_000, text: "But it's there." },
  { phase: "SEE",     fromMs: 20_000, toMs: 25_000, text: "Until you see it." },
  { phase: "CLARITY", fromMs: 25_000, toMs: 35_000, text: "See your real risk." },
];

export const TASKS = [
  "Parsing your portfolio file",
  "Fetching live market prices",
  "Running AI risk analysis",
  "Generating personalized report",
] as const;

export const REAL_TIME_MESSAGES = [
  "Cross-referencing your holdings with our database of 50,000+ securities...",
  "Analyzing sector correlations using machine learning models...",
  "Checking for hidden risks in ETF underlying holdings...",
  "Calculating real-time alpha and beta coefficients...",
  "Synchronizing with global exchanges for latest price action...",
] as const;

export const REAL_TIME_INTERVAL_MS = 4_000;

// интерфейсные строки
export const HEADER_CLARITY = "Analysis complete";
export const SUBTITLE = "Our AI is scanning real-time market data to analyze your portfolio";
export const REAL_TIME_BADGE = "Real-Time Data";

// финал
export const BRAND = "Guardfolio AI";
export const TAGLINE = "Understand your portfolio.";

