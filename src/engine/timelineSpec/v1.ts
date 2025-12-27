/**
 * TimelineSpec v1 - спецификация timeline с константами и типами (версия 1).
 * 
 * Версионированный модуль для timeline спецификации.
 * При изменении структуры создается новая версия (v2, v3, etc.).
 */

import {
  DURATION_MS,
  TIMELINE,
  MACRO_PHASES,
  NARRATIVE_WINDOWS,
  DYNAMIC_HEADERS,
  BEAM_SCHEDULE,
  Phase,
  MacroPhase,
} from '../../constants';

export type { Phase, MacroPhase };

export const TIMELINE_SPEC = {
  duration: DURATION_MS,
  phases: TIMELINE,
  macroPhases: MACRO_PHASES,
  narrativeWindows: NARRATIVE_WINDOWS,
  dynamicHeaders: DYNAMIC_HEADERS,
  beamSchedule: BEAM_SCHEDULE,
} as const;

/**
 * Chart Role Configuration
 */
export type ChartRole = 'signal' | 'context' | 'foundation';

export interface ChartRoleParams {
  opacity: number;
  blur: number;
  scale: number;
}

/**
 * Energy Beam Event
 */
export interface EnergyBeamEvent {
  taskIndex: number;
  t: number; // 0..1 (firing progress), or negative if charging?
  phase: 'charging' | 'firing';
}

/**
 * Timeline State - полное состояние timeline в конкретный момент времени.
 */
export interface TimelineState {
  elapsed: number;
  phase: Phase;
  macroPhase: MacroPhase;
  intensity: number; // 0..1 для текущей фазы
  
  // Chart state
  chartRole: ChartRole;
  chartParams: ChartRoleParams;
  
  // UI state
  uiOpacity: number;
  uiScale: number;
  uiBlur: number;
  uiBreathing: number;
  isInterrupt: boolean;
  
  // Narrative state
  narrativeText: string | null;
  dynamicHeader: string | null;
  
  // Beam state
  beamEvent: EnergyBeamEvent | null;
  visibleTasksCount: number;
  taskImpactIndex: number | null;
  taskProgress: number; // 0..100
  
  // Brand/Logo state
  brandProgress: number; // 0..1
  implosionProgress: number; // 0..1
  implosionScale: number;
  implosionOpacity: number;
}

