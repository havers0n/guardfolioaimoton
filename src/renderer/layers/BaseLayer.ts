/**
 * BaseLayer - базовый класс для всех слоев рендеринга.
 * Каждый слой должен реализовать update() и destroy().
 */

import { TimelineState } from '../../engine/timelineSpec';
import * as PIXI from 'pixi.js';

export abstract class BaseLayer {
  protected container: PIXI.Container;
  protected viewport: { getWidth(): number; getHeight(): number };

  constructor(container: PIXI.Container, viewport: { getWidth(): number; getHeight(): number }) {
    this.container = container;
    this.viewport = viewport;
  }

  /**
   * Обновляет слой на основе состояния timeline.
   * @param dt - время с последнего кадра в миллисекундах
   * @param state - текущее состояние timeline
   */
  abstract update(dt: number, state: TimelineState): void;

  /**
   * Очищает ресурсы слоя.
   */
  abstract destroy(): void;

  /**
   * Получает контейнер PixiJS для этого слоя.
   */
  getContainer(): PIXI.Container {
    return this.container;
  }
}

