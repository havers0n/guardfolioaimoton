/**
 * Spec Compiler - компиляция JSON spec в lookup tables для быстрого доступа.
 * 
 * Превращает декларативный JSON spec в оптимизированные lookup tables,
 * которые используются engine для вычисления состояния timeline.
 */

import type { TimelineSpecJSON, Phase, MacroPhase, TimeRange, ChartRoleConfig } from './types';

/**
 * Lookup table для фаз
 */
export interface PhaseLookup {
  phase: Phase;
  fromMs: number;
  toMs: number;
}

/**
 * Lookup table для макрофаз
 */
export interface MacroPhaseLookup {
  macroPhase: MacroPhase;
  fromMs: number;
  toMs: number;
}

/**
 * Lookup table для narrative окон
 */
export interface NarrativeLookup {
  start: number;
  end: number;
  text: string;
}

/**
 * Lookup table для dynamic headers
 */
export interface DynamicHeaderLookup {
  start: number;
  end: number;
  text: string;
}

/**
 * Lookup table для beam событий
 */
export interface BeamLookup {
  start: number;
  end: number;
  taskIndex: number;
  chargeStart: number; // start - 100ms
}

/**
 * Lookup table для chart roles
 */
export interface ChartRoleLookup {
  role: 'signal' | 'context' | 'foundation';
  fromMs: number;
  toMs: number;
  opacityStart: number;
  opacityEnd: number;
  blurStart: number;
  blurEnd: number;
  scaleStart: number;
  scaleEnd: number;
}

/**
 * Скомпилированный spec - оптимизированные lookup tables
 */
export interface CompiledSpec {
  duration: number;
  phases: PhaseLookup[];
  macroPhases: MacroPhaseLookup[];
  narrativeWindows: NarrativeLookup[];
  dynamicHeaders: DynamicHeaderLookup[];
  beamSchedule: BeamLookup[];
  chartRoles: ChartRoleLookup[];
  uiBreathing?: {
    fromMs: number;
    toMs: number;
    cycleMs: number;
    amplitude: number;
  };
  brand?: {
    start: number;
    duration: number;
  };
  implosion?: {
    start: number;
    duration: number;
  };
  tasks?: string[];
  brandText?: string;
  tagline?: string;
  subtitle?: string;
}

/**
 * Компилирует JSON spec в lookup tables
 */
export function compileSpec(spec: TimelineSpecJSON): CompiledSpec {
  // Сортируем фазы по времени начала
  const phases: PhaseLookup[] = Object.entries(spec.phases)
    .map(([phase, range]) => ({
      phase: phase as Phase,
      fromMs: range.fromMs,
      toMs: range.toMs,
    }))
    .sort((a, b) => a.fromMs - b.fromMs);

  // Сортируем макрофазы по времени начала
  const macroPhases: MacroPhaseLookup[] = Object.entries(spec.macroPhases)
    .map(([macroPhase, range]) => ({
      macroPhase: macroPhase as MacroPhase,
      fromMs: range.fromMs,
      toMs: range.toMs,
    }))
    .sort((a, b) => a.fromMs - b.fromMs);

  // Сортируем narrative windows по времени начала
  const narrativeWindows: NarrativeLookup[] = spec.narrativeWindows
    .map(w => ({
      start: w.start,
      end: w.end,
      text: w.text,
    }))
    .sort((a, b) => a.start - b.start);

  // Сортируем dynamic headers по времени начала
  const dynamicHeaders: DynamicHeaderLookup[] = spec.dynamicHeaders
    .map(h => ({
      start: h.start,
      end: h.end,
      text: h.text,
    }))
    .sort((a, b) => a.start - b.start);

  // Сортируем beam schedule по времени начала
  const beamSchedule: BeamLookup[] = spec.beamSchedule
    .map(beam => ({
      start: beam.start,
      end: beam.end,
      taskIndex: beam.taskIndex,
      chargeStart: beam.start - 100, // 100ms charging before firing
    }))
    .sort((a, b) => a.start - b.start);

  // Компилируем chart roles
  const chartRoles: ChartRoleLookup[] = spec.chartRoles.map(role => ({
    role: role.role,
    fromMs: role.timeRange.fromMs,
    toMs: role.timeRange.toMs,
    opacityStart: role.params.opacity.start,
    opacityEnd: role.params.opacity.end,
    blurStart: role.params.blur.start,
    blurEnd: role.params.blur.end,
    scaleStart: role.params.scale.start,
    scaleEnd: role.params.scale.end,
  }));

  const compiled: CompiledSpec = {
    duration: spec.duration,
    phases,
    macroPhases,
    narrativeWindows,
    dynamicHeaders,
    beamSchedule,
    chartRoles,
    tasks: spec.tasks,
    brandText: spec.brandText,
    tagline: spec.tagline,
    subtitle: spec.subtitle,
  };

  // Опциональные конфигурации
  if (spec.uiBreathing) {
    compiled.uiBreathing = {
      fromMs: spec.uiBreathing.timeRange.fromMs,
      toMs: spec.uiBreathing.timeRange.toMs,
      cycleMs: spec.uiBreathing.cycleMs,
      amplitude: spec.uiBreathing.amplitude,
    };
  }

  if (spec.brand) {
    compiled.brand = {
      start: spec.brand.start,
      duration: spec.brand.duration,
    };
  }

  if (spec.implosion) {
    compiled.implosion = {
      start: spec.implosion.start,
      duration: spec.implosion.duration,
    };
  }

  return compiled;
}

/**
 * Быстрый поиск фазы по времени (бинарный поиск)
 */
export function findPhaseAt(compiled: CompiledSpec, ms: number): Phase {
  // Линейный поиск достаточен для небольшого количества фаз
  for (let i = compiled.phases.length - 1; i >= 0; i--) {
    const phase = compiled.phases[i];
    if (ms >= phase.fromMs && ms < phase.toMs) {
      return phase.phase;
    }
  }
  
  // Fallback на последнюю фазу
  return compiled.phases[compiled.phases.length - 1]?.phase || 'SIGNAL';
}

/**
 * Быстрый поиск макрофазы по времени
 */
export function findMacroPhaseAt(compiled: CompiledSpec, ms: number): MacroPhase {
  for (let i = compiled.macroPhases.length - 1; i >= 0; i--) {
    const macroPhase = compiled.macroPhases[i];
    if (ms >= macroPhase.fromMs && ms < macroPhase.toMs) {
      return macroPhase.macroPhase;
    }
  }
  
  return compiled.macroPhases[compiled.macroPhases.length - 1]?.macroPhase || 'SIGNAL';
}

/**
 * Поиск narrative окна по времени
 */
export function findNarrativeWindow(compiled: CompiledSpec, ms: number): NarrativeLookup | null {
  for (const window of compiled.narrativeWindows) {
    if (ms >= window.start && ms < window.end) {
      return window;
    }
  }
  return null;
}

/**
 * Поиск dynamic header по времени
 */
export function findDynamicHeader(compiled: CompiledSpec, ms: number): string | null {
  for (const header of compiled.dynamicHeaders) {
    if (ms >= header.start && ms < header.end) {
      return header.text;
    }
  }
  return null;
}

/**
 * Поиск beam события по времени
 */
export function findBeamEvent(
  compiled: CompiledSpec,
  ms: number
): { taskIndex: number; t: number; phase: 'charging' | 'firing' } | null {
  for (const beam of compiled.beamSchedule) {
    // Charging phase
    if (ms >= beam.chargeStart && ms < beam.start) {
      const chargeProgress = (ms - beam.chargeStart) / 100;
      return {
        taskIndex: beam.taskIndex,
        t: Math.max(0, Math.min(1, chargeProgress)),
        phase: 'charging',
      };
    }
    
    // Firing phase
    if (ms >= beam.start && ms < beam.end) {
      const fireProgress = (ms - beam.start) / (beam.end - beam.start);
      return {
        taskIndex: beam.taskIndex,
        t: Math.max(0, Math.min(1, fireProgress)),
        phase: 'firing',
      };
    }
  }
  return null;
}

/**
 * Поиск chart role по времени
 */
export function findChartRoleAt(
  compiled: CompiledSpec,
  ms: number
): { role: 'signal' | 'context' | 'foundation'; params: { opacity: number; blur: number; scale: number } } {
  for (const role of compiled.chartRoles) {
    if (ms >= role.fromMs && ms < role.toMs) {
      const duration = role.toMs - role.fromMs;
      const elapsed = ms - role.fromMs;
      const t = Math.max(0, Math.min(1, elapsed / duration));
      
      // Smoothstep easing
      const easeT = t * t * (3 - 2 * t);
      
      return {
        role: role.role,
        params: {
          opacity: role.opacityStart + (role.opacityEnd - role.opacityStart) * easeT,
          blur: role.blurStart + (role.blurEnd - role.blurStart) * easeT,
          scale: role.scaleStart + (role.scaleEnd - role.scaleStart) * easeT,
        },
      };
    }
  }
  
  // Fallback на последний role
  const lastRole = compiled.chartRoles[compiled.chartRoles.length - 1];
  if (lastRole) {
    return {
      role: lastRole.role,
      params: {
        opacity: lastRole.opacityEnd,
        blur: lastRole.blurEnd,
        scale: lastRole.scaleEnd,
      },
    };
  }
  
  // Default fallback
  return {
    role: 'signal',
    params: { opacity: 0.08, blur: 6, scale: 0.96 },
  };
}

