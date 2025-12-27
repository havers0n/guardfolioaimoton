import {
  DURATION_MS,
  TIMELINE,
  MACRO_PHASES,
  NARRATIVE_WINDOWS,
  DYNAMIC_HEADERS,
  BEAM_SCHEDULE,
  Phase,
  MacroPhase,
} from "./constants";

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * clamp01(t);
}

// Phase helpers
export function getPhaseAt(ms: number): Phase {
  if (ms < TIMELINE.SIGNAL.toMs) return 'SIGNAL';
  if (ms < TIMELINE.RISK_EMERGENCE.toMs) return 'RISK_EMERGENCE';
  if (ms < TIMELINE.BREATHING.toMs) return 'BREATHING';
  if (ms < TIMELINE.FLASH_RAYS.toMs) return 'FLASH_RAYS';
  if (ms < TIMELINE.ENERGY_FLOW.toMs) return 'ENERGY_FLOW';
  if (ms < TIMELINE.ANALYSIS_COMPLETE.toMs) return 'ANALYSIS_COMPLETE';
  return 'CLARITY_LOGO';
}

export function getMacroPhaseAt(ms: number): MacroPhase {
  if (ms < MACRO_PHASES.SIGNAL.toMs) return 'SIGNAL';
  if (ms < MACRO_PHASES.INTERPRETATION.toMs) return 'INTERPRETATION';
  if (ms < MACRO_PHASES.STRUCTURE.toMs) return 'STRUCTURE';
  return 'CLARITY';
}

// Chart Role Logic
export type ChartRole = 'signal' | 'context' | 'foundation';
export interface ChartRoleParams {
  opacity: number;
  blur: number;
  scale: number;
}

export function getChartRoleAt(ms: number): { role: ChartRole; params: ChartRoleParams } {
  // 0–4s => signal (хаос графиков)
  // 4–10s => context (появление красных точек, дыхание UI)
  // 10–25s => foundation (чистый UI, лучи, анализ)
  
  let role: ChartRole = 'signal';
  let t = 0;

  if (ms < 4_000) {
    role = 'signal';
    // signal (0-4s): хаос графиков - opacity 0.08→0.75, blur 6→1, scale 0.96→1.0
    t = ms / 4_000;
    // Special ease-in for signal
    const easeT = t * t * (3 - 2 * t);
    
    return {
      role,
      params: {
        opacity: lerp(0.08, 0.75, easeT),
        blur: lerp(6, 1, easeT),
        scale: lerp(0.96, 1.0, easeT)
      }
    };
  } else if (ms < 10_000) {
    role = 'context';
    // context (4-10s): появление красных точек, дыхание UI - opacity 0.40→0.20, blur 2→5, scale 0.98→0.90
    t = (ms - 4_000) / 6_000; // 0..1 over 6s
    const easeT = t * t * (3 - 2 * t);

    return {
      role,
      params: {
        opacity: lerp(0.40, 0.20, easeT),
        blur: lerp(2, 5, easeT),
        scale: lerp(0.98, 0.90, easeT)
      }
    };
  } else {
    role = 'foundation';
    // foundation (10-25s): чистый UI - opacity 0.20→0.02, blur 5→9, scale 0.90→0.85
    t = (ms - 10_000) / (25_000 - 10_000); // 0..1 over 15s
    const easeT = t * t * (3 - 2 * t);

    return {
      role,
      params: {
        opacity: lerp(0.20, 0.02, easeT),
        blur: lerp(5, 9, easeT),
        scale: lerp(0.90, 0.85, easeT)
      }
    };
  }
}

// Narrative & Headers
export function getNarrativeWindow(ms: number) {
  return NARRATIVE_WINDOWS.find(w => ms >= w.start && ms < w.end);
}

export function isNarrativeInterrupt(ms: number): boolean {
  return !!getNarrativeWindow(ms);
}

export function getDynamicHeader(ms: number) {
  return DYNAMIC_HEADERS.find(h => ms >= h.start && ms < h.end)?.text;
}

// Beam & Task Logic
export interface EnergyBeamEvent {
  taskIndex: number;
  t: number; // 0..1 (firing progress), or negative if charging?
  phase: 'charging' | 'firing';
}

export function getEnergyBeamEvent(ms: number): EnergyBeamEvent | null {
  for (const beam of BEAM_SCHEDULE) {
    // Charging: 100ms before start
    const chargeStart = beam.start - 100;
    
    if (ms >= chargeStart && ms < beam.start) {
      const chargeProgress = (ms - chargeStart) / 100;
      return { taskIndex: beam.taskIndex, t: chargeProgress, phase: 'charging' };
    }
    
    if (ms >= beam.start && ms < beam.end) {
      const fireProgress = (ms - beam.start) / (beam.end - beam.start);
      return { taskIndex: beam.taskIndex, t: fireProgress, phase: 'firing' };
    }
  }
  return null;
}

export function getVisibleTasksCount(ms: number): number {
  let count = 0;
  for (const beam of BEAM_SCHEDULE) {
    if (ms >= beam.end) {
      count++;
    }
  }
  return count;
}

export function getTaskImpactIndex(ms: number): number | null {
  for (const beam of BEAM_SCHEDULE) {
    // Highlight for 400ms after impact
    if (ms >= beam.end && ms < beam.end + 400) {
      return beam.taskIndex;
    }
  }
  return null;
}

export function getTaskProgress(ms: number): number {
  if (ms < 10_000) return 0;
  // FLASH_RAYS (10s) -> ANALYSIS_COMPLETE (20s)
  const runDuration = 20_000 - 10_000;
  const progress = (ms - 10_000) / runDuration;
  return clamp01(progress) * 100;
}

// UI Breathing effect (7-10s)
export function getUIBreathing(ms: number): number {
  if (ms < 7_000 || ms >= 10_000) return 0;
  // Breathing: subtle scale pulse during BREATHING phase
  const breathingCycle = (ms - 7_000) / 500; // 500ms cycle
  return Math.sin(breathingCycle * Math.PI * 2) * 0.02; // +/- 2% scale variation
}
