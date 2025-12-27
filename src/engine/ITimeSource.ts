/**
 * ITimeSource - интерфейс для источников времени.
 * Позволяет использовать как TimeSource, так и FixedStepTimeSource в TimelineEngine.
 */

export interface ITimeSource {
  /**
   * Инициализирует источник времени.
   */
  initialize(): void;

  /**
   * Устанавливает принудительное время (для seek mode / screenshots).
   */
  setForcedTime(ms: number | null): void;

  /**
   * Возвращает текущее время в миллисекундах с начала анимации.
   */
  getElapsed(): number;

  /**
   * Сбрасывает источник времени.
   */
  reset(): void;
}

