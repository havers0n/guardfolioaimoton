export const DURATION_MS = 25_000;

export type Phase = 
  | 'SIGNAL' 
  | 'RISK_EMERGENCE' 
  | 'BREATHING' 
  | 'FLASH_RAYS' 
  | 'ENERGY_FLOW' 
  | 'ANALYSIS_COMPLETE' 
  | 'CLARITY_LOGO';

export type MacroPhase = 'SIGNAL' | 'INTERPRETATION' | 'STRUCTURE' | 'CLARITY';

export const TIMELINE = {
  SIGNAL:            { fromMs: 0,      toMs: 4_000 },
  RISK_EMERGENCE:    { fromMs: 4_000,  toMs: 7_000 },
  BREATHING:         { fromMs: 7_000,  toMs: 10_000 },
  FLASH_RAYS:        { fromMs: 10_000, toMs: 13_000 },
  ENERGY_FLOW:       { fromMs: 13_000, toMs: 20_000 },
  ANALYSIS_COMPLETE: { fromMs: 20_000, toMs: 22_000 },
  CLARITY_LOGO:      { fromMs: 22_000, toMs: 25_000 },
} as const;

export const MACRO_PHASES = {
  SIGNAL:         { fromMs: 0,      toMs: 7_000 },
  INTERPRETATION: { fromMs: 7_000,  toMs: 13_000 },
  STRUCTURE:      { fromMs: 13_000, toMs: 20_000 },
  CLARITY:        { fromMs: 20_000, toMs: 25_000 },
} as const;

export const NARRATIVE_WINDOWS = [
  { start: 1_000, end: 3_500, text: "Markets move. Risk hides." },
  { start: 4_500, end: 6_500, text: "Something feels off." },
  { start: 7_500, end: 9_500, text: "Until you see it." },
  { start: 20_500, end: 22_000, text: "See your real risk." },
] as const;

// Adjusted for 13-20s range
export const BEAM_SCHEDULE = [
  { start: 13_200, end: 13_600, taskIndex: 0 },
  { start: 14_800, end: 15_200, taskIndex: 1 },
  { start: 16_400, end: 16_800, taskIndex: 2 },
  { start: 18_000, end: 18_400, taskIndex: 3 },
] as const;

export const DYNAMIC_HEADERS = [
  { start: 10_000, end: 13_000, text: "System Initializing..." },
  { start: 13_000, end: 15_000, text: "Mapping risk exposures…" },
  { start: 15_000, end: 17_000, text: "Detecting hidden correlations…" },
  { start: 17_000, end: 20_000, text: "Synthesizing risk insight…" },
  { start: 20_000, end: 22_000, text: "Analysis complete" },
] as const;

export const REAL_TIME_MESSAGES = [
  "Cross-referencing holdings against 50,000+ instruments…",
  "Estimating factor exposures and regime sensitivity…",
  "Resolving ETF look-through and hidden concentrations…",
  "Computing real-time beta, drawdown risk, tail metrics…",
  "Synchronizing with venues for latest price action…",
];

export const SUBTITLE = "Our AI is scanning real-time market data to analyze your portfolio";

export const TASKS = [
  "Market Correlation Analysis",
  "Factor Exposure Estimation",
  "Tail Risk Computation",
  "Liquidity Stress Testing"
];

export const BRAND = "GUARDFOLIO AI";
export const TAGLINE = "Understand your portfolio.";
