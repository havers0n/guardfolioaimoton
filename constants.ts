import { Task, TaskStatus, NarrativePhase } from './types';

export const INITIAL_TASKS: Task[] = [
  { id: 'parse', label: 'Parsing your portfolio file', status: TaskStatus.PENDING },
  { id: 'fetch', label: 'Fetching live market prices', status: TaskStatus.PENDING },
  { id: 'risk', label: 'Running AI risk analysis', status: TaskStatus.PENDING },
  { id: 'report', label: 'Generating personalized report', status: TaskStatus.PENDING },
];

export const REAL_TIME_MESSAGES = [
  "Cross-referencing your holdings with our database of 50,000+ securities...",
  "Analyzing sector correlations using machine learning models...",
  "Checking for hidden risks in ETF underlying holdings...",
  "Calculating real-time alpha and beta coefficients...",
  "Synchronizing with global exchanges for latest price action..."
];

// Таймлайн нарратива (в секундах)
export const NARRATIVE_TIMELINE = {
  TOTAL_DURATION: 30,
  PHASES: {
    [NarrativePhase.DISTORTION]: { start: 0, end: 10, message: "Something feels off." },
    [NarrativePhase.TENSION]: { start: 10, end: 15, message: "You can't explain it." },
    [NarrativePhase.PAUSE]: { start: 15, end: 20, message: "But it's there." },
    [NarrativePhase.REVELATION]: { start: 20, end: 25, message: "Until you see it." },
    [NarrativePhase.CLARITY]: { start: 25, end: 30, message: "See your real risk." },
  }
} as const;
