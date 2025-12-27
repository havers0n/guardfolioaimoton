/**
 * TimelineStateHelper - чистая функция для получения TimelineState по времени.
 * 
 * Используется в Storybook для отображения компонентов в разных состояниях
 * без необходимости запуска runtime engine.
 */

import { loadSpecFromObject } from '../../engine/spec/loader';
import { compileSpec } from '../../engine/spec/compiler';
import { TimelineState, Phase, MacroPhase } from '../../engine/timelineSpec';
import type { TimelineSpecJSON } from '../../engine/spec/types';
import {
  findPhaseAt,
  findMacroPhaseAt,
  findNarrativeWindow,
  findDynamicHeader,
  findBeamEvent,
  findChartRoleAt,
} from '../../engine/spec/compiler';

/**
 * Default spec для Storybook (синхронная версия)
 * Данные из src/engine/spec/defaultSpec.json
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
 * Скомпилированный spec (кэшируется при первом использовании)
 */
let cachedCompiledSpec: ReturnType<typeof compileSpec> | null = null;

/**
 * Получает скомпилированный spec (кэшируется)
 */
function getCompiledSpec() {
  if (!cachedCompiledSpec) {
    const spec = loadSpecFromObject(DEFAULT_SPEC);
    cachedCompiledSpec = compileSpec(spec);
  }
  return cachedCompiledSpec;
}

/**
 * Clamp значение в диапазоне [0, 1]
 */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Получает состояние timeline для конкретного времени (детерминированно).
 * Чистая функция без зависимостей от runtime.
 */
export function getStateAt(timeMs: number): TimelineState {
  const compiled = getCompiledSpec();
  
  // Clamp время в пределах длительности
  const elapsed = Math.max(0, Math.min(timeMs, compiled.duration));
  
  // Phase
  const phase = findPhaseAt(compiled, elapsed) as Phase;
  
  // Phase intensity
  const phaseLookup = compiled.phases.find(p => p.phase === phase);
  let intensity = 0;
  if (phaseLookup) {
    const duration = phaseLookup.toMs - phaseLookup.fromMs;
    const phaseElapsed = elapsed - phaseLookup.fromMs;
    intensity = Math.max(0, Math.min(1, phaseElapsed / duration));
  }

  // Macro phase
  const macroPhase = findMacroPhaseAt(compiled, elapsed) as MacroPhase;

  // Chart role
  const chartRoleData = findChartRoleAt(compiled, elapsed);
  const chartRole = chartRoleData.role;
  const chartParams = chartRoleData.params;

  // Narrative state
  const narrativeWindow = findNarrativeWindow(compiled, elapsed);
  const narrativeText = narrativeWindow?.text || null;
  const dynamicHeader = findDynamicHeader(compiled, elapsed);

  // Beam state
  const beamEvent = findBeamEvent(compiled, elapsed);
  const visibleTasksCount = compiled.beamSchedule.filter(beam => elapsed >= beam.end).length;
  const taskImpactIndex = (() => {
    for (const beam of compiled.beamSchedule) {
      if (elapsed >= beam.end && elapsed < beam.end + 400) {
        return beam.taskIndex;
      }
    }
    return null;
  })();
  
  // Task progress
  const flashRaysPhase = compiled.phases.find(p => p.phase === 'FLASH_RAYS');
  const analysisCompletePhase = compiled.phases.find(p => p.phase === 'ANALYSIS_COMPLETE');
  let taskProgress = 0;
  if (flashRaysPhase && analysisCompletePhase) {
    if (elapsed >= flashRaysPhase.fromMs) {
      const runDuration = analysisCompletePhase.fromMs - flashRaysPhase.fromMs;
      const progress = (elapsed - flashRaysPhase.fromMs) / runDuration;
      taskProgress = clamp01(progress) * 100;
    }
  }

  // UI breathing effect
  let uiBreathing = 0;
  if (compiled.uiBreathing) {
    const { fromMs, toMs, cycleMs, amplitude } = compiled.uiBreathing;
    if (elapsed >= fromMs && elapsed < toMs) {
      const breathingCycle = (elapsed - fromMs) / cycleMs;
      uiBreathing = Math.sin(breathingCycle * Math.PI * 2) * amplitude;
    }
  }

  // Brand Progress
  let brandProgress = 0;
  if (compiled.brand) {
    const { start, duration } = compiled.brand;
    brandProgress = elapsed > start 
      ? clamp01((elapsed - start) / duration) 
      : 0;
  }

  // Implosion Logic
  let implosionProgress = 0;
  if (compiled.implosion) {
    const { start, duration } = compiled.implosion;
    implosionProgress = elapsed > start 
      ? clamp01((elapsed - start) / duration) 
      : 0;
  }
  
  const implosionScale = 1 - implosionProgress;
  const implosionOpacity = 1 - implosionProgress;

  // UI opacity, scale, blur
  let uiOpacity = 1;
  let uiScale = 1;
  let uiBlur = 0;

  // Apply UI breathing effect (7-10s)
  if (phase === 'BREATHING') {
    uiScale = 1 + uiBreathing;
  }

  // Apply implosion (22s+)
  if (implosionProgress > 0) {
    uiOpacity = implosionOpacity;
    uiScale = implosionScale;
  }

  // Cinema Mode (narrative interrupt)
  const isInterrupt = !!narrativeWindow;
  if (isInterrupt) {
    uiOpacity = 0.2;
    uiScale = 0.9;
    uiBlur = 12;
  }

  const state: TimelineState = {
    elapsed,
    phase,
    macroPhase,
    intensity,
    chartRole,
    chartParams,
    uiOpacity,
    uiScale,
    uiBlur,
    uiBreathing,
    isInterrupt,
    narrativeText,
    dynamicHeader,
    beamEvent,
    visibleTasksCount,
    taskImpactIndex,
    taskProgress,
    brandProgress,
    implosionProgress,
    implosionScale,
    implosionOpacity,
  };

  return state;
}

/**
 * Получает длительность timeline в миллисекундах
 */
export function getDuration(): number {
  const compiled = getCompiledSpec();
  return compiled.duration;
}

/**
 * Получает список фаз с их временными диапазонами
 */
export function getPhases(): Array<{ phase: Phase; fromMs: number; toMs: number }> {
  const compiled = getCompiledSpec();
  return compiled.phases.map(p => ({
    phase: p.phase as Phase,
    fromMs: p.fromMs,
    toMs: p.toMs,
  }));
}

