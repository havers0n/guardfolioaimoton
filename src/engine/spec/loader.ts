/**
 * Spec Loader - загрузка и валидация JSON spec в runtime.
 * 
 * Поддерживает:
 * - Загрузку spec из JSON файла
 * - Валидацию структуры
 * - Fallback на default spec
 */

import type { TimelineSpecJSON } from './types';

/**
 * Default spec - встроенная константа для fallback
 */
const DEFAULT_SPEC: TimelineSpecJSON = {
  metadata: {
    name: 'Guardfolio',
    version: '1.0.0',
    description: 'Guardfolio AI risk visualization scene',
  },
  duration: 25000,
  phases: {
    SIGNAL: { fromMs: 0, toMs: 4000 },
    RISK_EMERGENCE: { fromMs: 4000, toMs: 7000 },
    BREATHING: { fromMs: 7000, toMs: 10000 },
    FLASH_RAYS: { fromMs: 10000, toMs: 13000 },
    ENERGY_FLOW: { fromMs: 13000, toMs: 20000 },
    ANALYSIS_COMPLETE: { fromMs: 20000, toMs: 22000 },
    CLARITY_LOGO: { fromMs: 22000, toMs: 25000 },
  },
  macroPhases: {
    SIGNAL: { fromMs: 0, toMs: 7000 },
    INTERPRETATION: { fromMs: 7000, toMs: 13000 },
    STRUCTURE: { fromMs: 13000, toMs: 20000 },
    CLARITY: { fromMs: 20000, toMs: 25000 },
  },
  narrativeWindows: [
    { start: 1000, end: 3500, text: 'Markets move. Risk hides.' },
    { start: 4500, end: 6500, text: 'Something feels off.' },
    { start: 7500, end: 9500, text: 'Until you see it.' },
    { start: 20500, end: 22000, text: 'See your real risk.' },
  ],
  dynamicHeaders: [
    { start: 10000, end: 13000, text: 'System Initializing...' },
    { start: 13000, end: 15000, text: 'Mapping risk exposures…' },
    { start: 15000, end: 17000, text: 'Detecting hidden correlations…' },
    { start: 17000, end: 20000, text: 'Synthesizing risk insight…' },
    { start: 20000, end: 22000, text: 'Analysis complete' },
  ],
  beamSchedule: [
    { start: 13200, end: 13600, taskIndex: 0 },
    { start: 14800, end: 15200, taskIndex: 1 },
    { start: 16400, end: 16800, taskIndex: 2 },
    { start: 18000, end: 18400, taskIndex: 3 },
  ],
  chartRoles: [
    {
      role: 'signal',
      timeRange: { fromMs: 0, toMs: 4000 },
      params: {
        opacity: { start: 0.08, end: 0.75 },
        blur: { start: 6, end: 1 },
        scale: { start: 0.96, end: 1.0 },
      },
    },
    {
      role: 'context',
      timeRange: { fromMs: 4000, toMs: 10000 },
      params: {
        opacity: { start: 0.40, end: 0.20 },
        blur: { start: 2, end: 5 },
        scale: { start: 0.98, end: 0.90 },
      },
    },
    {
      role: 'foundation',
      timeRange: { fromMs: 10000, toMs: 25000 },
      params: {
        opacity: { start: 0.20, end: 0.02 },
        blur: { start: 5, end: 9 },
        scale: { start: 0.90, end: 0.85 },
      },
    },
  ],
  uiBreathing: {
    timeRange: { fromMs: 7000, toMs: 10000 },
    cycleMs: 500,
    amplitude: 0.02,
  },
  brand: {
    start: 22000,
    duration: 3000,
  },
  implosion: {
    start: 22000,
    duration: 1000,
  },
  tasks: [
    'Market Correlation Analysis',
    'Factor Exposure Estimation',
    'Tail Risk Computation',
    'Liquidity Stress Testing',
  ],
  brandText: 'GUARDFOLIO AI',
  tagline: 'See the risk others miss.',
  subtitle: 'Our AI is scanning real-time market data to analyze your portfolio',
};

/**
 * Валидирует JSON spec
 */
export function validateSpec(spec: unknown): spec is TimelineSpecJSON {
  if (!spec || typeof spec !== 'object') {
    return false;
  }

  const s = spec as Record<string, unknown>;

  // Проверка metadata
  if (!s.metadata || typeof s.metadata !== 'object') {
    return false;
  }
  const metadata = s.metadata as Record<string, unknown>;
  if (typeof metadata.name !== 'string' || typeof metadata.version !== 'string') {
    return false;
  }

  // Проверка duration
  if (typeof s.duration !== 'number' || s.duration <= 0) {
    return false;
  }

  // Проверка phases
  if (!s.phases || typeof s.phases !== 'object') {
    return false;
  }

  // Проверка macroPhases
  if (!s.macroPhases || typeof s.macroPhases !== 'object') {
    return false;
  }

  // Проверка narrativeWindows
  if (!Array.isArray(s.narrativeWindows)) {
    return false;
  }

  // Проверка dynamicHeaders
  if (!Array.isArray(s.dynamicHeaders)) {
    return false;
  }

  // Проверка beamSchedule
  if (!Array.isArray(s.beamSchedule)) {
    return false;
  }

  // Проверка chartRoles
  if (!Array.isArray(s.chartRoles)) {
    return false;
  }

  return true;
}

/**
 * Загружает spec из URL или использует default
 */
export async function loadSpec(url?: string): Promise<TimelineSpecJSON> {
  if (!url) {
    // Используем встроенный default spec
    console.log('[SpecLoader] Using default spec');
    return DEFAULT_SPEC;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[SpecLoader] Failed to load spec from ${url}, using default`);
      return DEFAULT_SPEC;
    }

    const json = await response.json();
    
    if (!validateSpec(json)) {
      console.warn(`[SpecLoader] Invalid spec from ${url}, using default`);
      return DEFAULT_SPEC;
    }

    console.log(`[SpecLoader] Loaded spec from ${url}`);
    return json;
  } catch (error) {
    console.error(`[SpecLoader] Error loading spec from ${url}:`, error);
    console.warn(`[SpecLoader] Using default spec`);
    return DEFAULT_SPEC;
  }
}

/**
 * Загружает spec из объекта (для тестирования)
 */
export function loadSpecFromObject(spec: unknown): TimelineSpecJSON {
  if (!validateSpec(spec)) {
    console.warn('[SpecLoader] Invalid spec object, using default');
    return DEFAULT_SPEC;
  }

  return spec;
}

