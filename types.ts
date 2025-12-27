import { Phase } from './src/constants';

export enum TaskStatus {
  PENDING = 'PENDING',
  LOADING = 'LOADING',
  COMPLETED = 'COMPLETED'
}

export interface Task {
  id: string;
  label: string;
  status: TaskStatus;
}

export interface RealTimeUpdate {
  message: string;
}

// Маппинг старых фаз на новые для обратной совместимости
export enum NarrativePhase {
  DISTORTION = 'OFF',        // 0-10 сек: "Something feels off."
  TENSION = 'EXPLAIN',       // 10-15 сек: "You can't explain it."
  PAUSE = 'THERE',           // 15-20 сек: "But it's there."
  REVELATION = 'SEE',        // 20-25 сек: "Until you see it."
  CLARITY = 'CLARITY'        // 25-30 сек: "See your real risk."
}

// Функция для конвертации старого NarrativePhase в новый Phase
export function narrativePhaseToPhase(narrativePhase: NarrativePhase): Phase {
  return narrativePhase as unknown as Phase;
}

export interface NarrativeState {
  phase: Phase;
  elapsed: number;
  intensity: number; // 0-1 для управления интенсивностью эффектов
}
