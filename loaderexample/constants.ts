
import { Task, TaskStatus } from './types';

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
