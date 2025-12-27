/**
 * FixedStepTimeSource - детерминированный источник времени с фиксированным шагом.
 * Используется для записи видео, где требуется стабильный временной шаг.
 */

export class FixedStepTimeSource {
  private currentTime: number = 0;
  private step: number; // Шаг времени в миллисекундах (1000 / fps)
  private duration: number;
  private isRunning: boolean = false;

  /**
   * Создает fixed-step time source.
   * @param fps - кадров в секунду
   * @param duration - длительность в миллисекундах
   */
  constructor(fps: number, duration: number) {
    this.step = 1000 / fps;
    this.duration = duration;
  }

  /**
   * Сбрасывает время в начало.
   */
  reset(): void {
    this.currentTime = 0;
    this.isRunning = false;
  }

  /**
   * Запускает time source.
   */
  start(): void {
    this.currentTime = 0;
    this.isRunning = true;
  }

  /**
   * Останавливает time source.
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Переходит к следующему шагу времени.
   * @returns true если время еще не закончилось, false если достигнут конец
   */
  next(): boolean {
    if (!this.isRunning) {
      return false;
    }

    this.currentTime += this.step;
    return this.currentTime <= this.duration;
  }

  /**
   * Устанавливает текущее время.
   */
  setTime(ms: number): void {
    this.currentTime = Math.max(0, Math.min(ms, this.duration));
  }

  /**
   * Возвращает текущее время в миллисекундах.
   */
  getElapsed(): number {
    return this.currentTime;
  }

  /**
   * Проверяет, достигнут ли конец.
   */
  isFinished(): boolean {
    return this.currentTime >= this.duration;
  }

  /**
   * Получает шаг времени в миллисекундах.
   */
  getStep(): number {
    return this.step;
  }

  /**
   * Получает FPS.
   */
  getFps(): number {
    return 1000 / this.step;
  }
}

