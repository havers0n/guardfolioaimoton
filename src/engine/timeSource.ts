/**
 * TimeSource - детерминированный источник времени для timeline engine.
 * Использует performance.now() для реального времени и поддерживает seek mode.
 */
export class TimeSource {
  private startTime: number | null = null;
  private forcedTime: number | null = null;

  /**
   * Инициализирует источник времени.
   * Если startTime уже установлен глобально, использует его.
   */
  initialize(): void {
    if (typeof window !== 'undefined' && (window as any).__START_TIME__) {
      this.startTime = (window as any).__START_TIME__;
    } else {
      this.startTime = performance.now();
      if (typeof window !== 'undefined') {
        (window as any).__START_TIME__ = this.startTime;
      }
    }
  }

  /**
   * Устанавливает принудительное время (для seek mode / screenshots).
   */
  setForcedTime(ms: number | null): void {
    this.forcedTime = ms;
  }

  /**
   * Возвращает текущее время в миллисекундах с начала анимации.
   * Если установлено принудительное время, возвращает его.
   */
  getElapsed(): number {
    if (this.forcedTime !== null) {
      return this.forcedTime;
    }

    if (this.startTime === null) {
      this.initialize();
    }

    return performance.now() - (this.startTime || 0);
  }

  /**
   * Сбрасывает источник времени.
   */
  reset(): void {
    this.startTime = null;
    this.forcedTime = null;
    if (typeof window !== 'undefined') {
      delete (window as any).__START_TIME__;
    }
  }
}

