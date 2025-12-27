import type { ITimeSource } from './ITimeSource';

/**
 * FixedStepTimeSource - детерминированный источник времени с фиксированным шагом.
 * Используется для записи видео, где требуется стабильный временной шаг.
 */

export class FixedStepTimeSource implements ITimeSource {
  private forcedTime: number | null = null;
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
   * Инициализирует источник времени (реализация ITimeSource).
   */
  initialize(): void {
    this.currentTime = 0;
    this.isRunning = true;
  }

  /**
   * Устанавливает принудительное время (реализация ITimeSource).
   */
  setForcedTime(ms: number | null): void {
    this.forcedTime = ms;
    if (ms !== null) {
      this.currentTime = ms;
    }
  }

  /**
   * Сбрасывает время в начало.
   */
  reset(): void {
    this.currentTime = 0;
    this.isRunning = false;
    this.forcedTime = null;
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
   * Если установлено принудительное время, возвращает его.
   */
  getElapsed(): number {
    if (this.forcedTime !== null) {
      return this.forcedTime;
    }
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

