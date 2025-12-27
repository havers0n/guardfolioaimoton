/**
 * RNG - детерминированный генератор случайных чисел.
 * Используется для эффектов, которые должны быть воспроизводимыми.
 */

export class RNG {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  /**
   * Генерирует случайное число от 0 до 1.
   */
  random(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return (this.seed >>> 0) / Math.pow(2, 32);
  }

  /**
   * Генерирует случайное число в диапазоне [min, max).
   */
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /**
   * Генерирует случайное целое число в диапазоне [min, max).
   */
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }

  /**
   * Устанавливает seed.
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Получает текущий seed.
   */
  getSeed(): number {
    return this.seed;
  }
}

