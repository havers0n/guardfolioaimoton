export const DURATION_MS = 15_000;

export type Phase = "HOOK" | "OFF" | "EXPLAIN" | "THERE" | "SEE" | "CLARITY";

// Единый объект конфигурации таймлайна
export const TIMELINE = {
  DURATION_MS: 15_000,
  FADE_IN_MS: 200,
  FADE_OUT_MS: 200,
  HOOK: { fromMs: 0, toMs: 700 },
  OFF: { fromMs: 700, toMs: 3_000 },
  EXPLAIN: { fromMs: 3_000, toMs: 5_200 },
  THERE: { fromMs: 5_200, toMs: 7_400 },
  SEE: { fromMs: 7_400, toMs: 10_800 },
  CLARITY: { fromMs: 10_800, toMs: 15_000 },
} as const;

export const PHASES: Array<{ phase: Phase; fromMs: number; toMs: number; text: string }> = [
  { phase: "HOOK",    fromMs: 0,      toMs: 700,   text: "" },
  { phase: "OFF",     fromMs: 700,   toMs: 3_000, text: "Something feels off." },
  { phase: "EXPLAIN", fromMs: 3_000, toMs: 5_200, text: "You can't explain it." },
  { phase: "THERE",   fromMs: 5_200, toMs: 7_400, text: "But it's there." },
  { phase: "SEE",     fromMs: 7_400, toMs: 10_800, text: "Until you see it." },
  { phase: "CLARITY", fromMs: 10_800, toMs: 15_000, text: "See your real risk." },
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

