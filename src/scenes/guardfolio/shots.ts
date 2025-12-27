/**
 * Scene Shots - система композиции сцен для Guardfolio.
 * 
 * Определяет последовательность "шотов" (scene blocks) - временных интервалов,
 * в которых видимы определенные элементы сцены.
 * 
 * Это orchestration layer, который управляет видимостью элементов
 * на основе времени, не изменяя логику рендерера или элементов.
 */

export interface SceneShot {
  /** Уникальный идентификатор шота */
  id: string;
  /** Начало шота в миллисекундах */
  from: number;
  /** Конец шота в миллисекундах */
  to: number;
  /** Видимость элементов в этом шоте */
  visible: {
    /** Header / Title элемент (overlay-text) */
    header?: boolean;
    /** Chart элемент */
    chart?: boolean;
    /** Tasks / Progress элемент (может быть частью chart или отдельным) */
    tasks?: boolean;
    /** Logo элемент */
    logo?: boolean;
    /** Background всегда виден, но можно управлять если нужно */
    background?: boolean;
  };
  /** Дополнительные переопределения для элементов (опционально) */
  overrides?: {
    /** Текст для header */
    text?: string;
    /** Режим отображения chart */
    chartMode?: 'intro' | 'analysis' | 'result';
  };
}

/**
 * Определение шотов для сцены Guardfolio.
 * 
 * Шоты определяют последовательность визуальных композиций:
 * - intro: только заголовок
 * - analysis: заголовок + график + задачи
 * - reveal: логотип + заголовок
 */
export const SHOTS: SceneShot[] = [
  {
    id: 'intro',
    from: 0,
    to: 3000,
    visible: {
      header: true,
      chart: false,
      tasks: false,
      logo: false,
      background: true,
    },
  },
  {
    id: 'analysis',
    from: 3000,
    to: 12000,
    visible: {
      header: true,
      chart: true,
      tasks: true,
      logo: false,
      background: true,
    },
  },
  {
    id: 'reveal',
    from: 12000,
    to: 16000,
    visible: {
      header: true,
      chart: false,
      tasks: false,
      logo: true,
      background: true,
    },
  },
];

/**
 * Находит активный шот для указанного времени.
 * 
 * @param timeMs Время в миллисекундах
 * @returns Активный шот или null, если нет активного шота
 */
export function getActiveShot(timeMs: number): SceneShot | null {
  return SHOTS.find(shot => timeMs >= shot.from && timeMs < shot.to) || null;
}

/**
 * Получает все шоты в порядке их появления.
 */
export function getAllShots(): SceneShot[] {
  return SHOTS;
}

