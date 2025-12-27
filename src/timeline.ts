/**
 * Timeline Functions - функции для вычисления состояния timeline.
 * 
 * Теперь используют compiled spec вместо хардкода констант.
 */

import type { CompiledSpec } from './engine/spec';
import {
  findPhaseAt,
  findMacroPhaseAt,
  findNarrativeWindow,
  findDynamicHeader,
  findBeamEvent,
  findChartRoleAt,
} from './engine/spec';

/**
 * Глобальный compiled spec (устанавливается при инициализации)
 */
let compiledSpec: CompiledSpec | null = null;

/**
 * Устанавливает compiled spec для использования в функциях timeline
 */
export function setCompiledSpec(spec: CompiledSpec): void {
  compiledSpec = spec;
}

/**
 * Получает текущий compiled spec
 */
export function getCompiledSpec(): CompiledSpec | null {
  return compiledSpec;
}

/**
 * Проверяет, что spec установлен
 */
function ensureSpec(): CompiledSpec {
  if (!compiledSpec) {
    throw new Error('Compiled spec not set. Call setCompiledSpec() first.');
  }
  return compiledSpec;
}

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * clamp01(t);
}

// Phase helpers
export function getPhaseAt(ms: number): string {
  const spec = ensureSpec();
  return findPhaseAt(spec, ms);
}

export function getMacroPhaseAt(ms: number): string {
  const spec = ensureSpec();
  return findMacroPhaseAt(spec, ms);
}

// Chart Role Logic
export type ChartRole = 'signal' | 'context' | 'foundation';
export interface ChartRoleParams {
  opacity: number;
  blur: number;
  scale: number;
}

export function getChartRoleAt(ms: number): { role: ChartRole; params: ChartRoleParams } {
  const spec = ensureSpec();
  return findChartRoleAt(spec, ms);
}

// Narrative & Headers
export function getNarrativeWindow(ms: number) {
  const spec = ensureSpec();
  return findNarrativeWindow(spec, ms);
}

export function isNarrativeInterrupt(ms: number): boolean {
  return !!getNarrativeWindow(ms);
}

export function getDynamicHeader(ms: number): string | null {
  const spec = ensureSpec();
  return findDynamicHeader(spec, ms);
}

// Beam & Task Logic
export interface EnergyBeamEvent {
  taskIndex: number;
  t: number; // 0..1 (firing progress), or negative if charging?
  phase: 'charging' | 'firing';
}

export function getEnergyBeamEvent(ms: number): EnergyBeamEvent | null {
  const spec = ensureSpec();
  return findBeamEvent(spec, ms);
}

export function getVisibleTasksCount(ms: number): number {
  const spec = ensureSpec();
  let count = 0;
  for (const beam of spec.beamSchedule) {
    if (ms >= beam.end) {
      count++;
    }
  }
  return count;
}

export function getTaskImpactIndex(ms: number): number | null {
  const spec = ensureSpec();
  for (const beam of spec.beamSchedule) {
    // Highlight for 400ms after impact
    if (ms >= beam.end && ms < beam.end + 400) {
      return beam.taskIndex;
    }
  }
  return null;
}

export function getTaskProgress(ms: number): number {
  const spec = ensureSpec();
  // Находим фазу FLASH_RAYS для начала прогресса
  const flashRaysPhase = spec.phases.find(p => p.phase === 'FLASH_RAYS');
  const analysisCompletePhase = spec.phases.find(p => p.phase === 'ANALYSIS_COMPLETE');
  
  if (!flashRaysPhase || !analysisCompletePhase) {
    return 0;
  }
  
  if (ms < flashRaysPhase.fromMs) return 0;
  
  const runDuration = analysisCompletePhase.fromMs - flashRaysPhase.fromMs;
  const progress = (ms - flashRaysPhase.fromMs) / runDuration;
  return clamp01(progress) * 100;
}

// UI Breathing effect
export function getUIBreathing(ms: number): number {
  const spec = ensureSpec();
  
  if (!spec.uiBreathing) {
    return 0;
  }
  
  const { fromMs, toMs, cycleMs, amplitude } = spec.uiBreathing;
  
  if (ms < fromMs || ms >= toMs) {
    return 0;
  }
  
  // Breathing: subtle scale pulse during BREATHING phase
  const breathingCycle = (ms - fromMs) / cycleMs;
  return Math.sin(breathingCycle * Math.PI * 2) * amplitude;
}
