import {
  DURATION_MS,
  PHASES,
  TASKS,
  REAL_TIME_MESSAGES,
  REAL_TIME_INTERVAL_MS,
  Phase,
} from "./constants";

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function getPhaseAt(ms: number) {
  const t = ((ms % DURATION_MS) + DURATION_MS) % DURATION_MS;
  const item = PHASES.find(p => t >= p.fromMs && t < p.toMs) ?? PHASES[0];
  return { phase: item.phase as Phase, phaseText: item.text, tMs: t };
}

export function getTotalProgress(ms: number) {
  return clamp01(ms / DURATION_MS);
}

// Активная задача: крутится в фазе SEE (20–25с) или шире — как тебе надо
export function getTaskAt(ms: number) {
  // Делим весь ролик на 4 части по задачам, но показываем только в нужной фазе
  const t = ((ms % DURATION_MS) + DURATION_MS) % DURATION_MS;
  const idx = Math.min(TASKS.length - 1, Math.floor((t / DURATION_MS) * TASKS.length));
  return TASKS[idx];
}

export function getTaskProgress(ms: number) {
  // Процент внутри текущей "задачной" зоны (например 20–25с)
  const t = ((ms % DURATION_MS) + DURATION_MS) % DURATION_MS;
  const from = 20_000;
  const to = 25_000;

  if (t < from) return 0;
  if (t >= to) return 100;

  const p = (t - from) / (to - from);
  return Math.round(p * 100);
}

export function getRealTimeMessage(ms: number) {
  const t = ((ms % DURATION_MS) + DURATION_MS) % DURATION_MS;
  const idx = Math.floor(t / REAL_TIME_INTERVAL_MS) % REAL_TIME_MESSAGES.length;
  return REAL_TIME_MESSAGES[idx];
}

