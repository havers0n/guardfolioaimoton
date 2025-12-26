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

export enum NarrativePhase {
  DISTORTION = 'DISTORTION',        // 0-10 сек: "Something feels off."
  TENSION = 'TENSION',              // 10-15 сек: "You can't explain it."
  PAUSE = 'PAUSE',                  // 15-20 сек: "But it's there."
  REVELATION = 'REVELATION',        // 20-25 сек: "Until you see it."
  CLARITY = 'CLARITY'               // 25-30 сек: "See your real risk."
}

export interface NarrativeState {
  phase: NarrativePhase;
  elapsed: number;
  intensity: number; // 0-1 для управления интенсивностью эффектов
}
