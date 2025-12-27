/**
 * Viewport - управление размером и масштабированием viewport.
 * Все координаты нормализованы (0-1).
 */

export interface ViewportConfig {
  width: number;
  height: number;
  pixelRatio?: number;
}

export class Viewport {
  private width: number;
  private height: number;
  private pixelRatio: number;

  constructor(config: ViewportConfig) {
    this.width = config.width;
    this.height = config.height;
    this.pixelRatio = config.pixelRatio || Math.min(window.devicePixelRatio || 1, 2);
  }

  /**
   * Обновляет размер viewport.
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Получает ширину в пикселях.
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Получает высоту в пикселях.
   */
  getHeight(): number {
    return this.height;
  }

  /**
   * Получает pixel ratio.
   */
  getPixelRatio(): number {
    return this.pixelRatio;
  }

  /**
   * Конвертирует нормализованную координату X в пиксели.
   */
  denormalizeX(normalizedX: number): number {
    return normalizedX * this.width;
  }

  /**
   * Конвертирует нормализованную координату Y в пиксели.
   */
  denormalizeY(normalizedY: number): number {
    return normalizedY * this.height;
  }

  /**
   * Конвертирует пиксельную координату X в нормализованную.
   */
  normalizeX(pixelX: number): number {
    return this.width > 0 ? pixelX / this.width : 0;
  }

  /**
   * Конвертирует пиксельную координату Y в нормализованную.
   */
  normalizeY(pixelY: number): number {
    return this.height > 0 ? pixelY / this.height : 0;
  }
}

