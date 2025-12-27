/**
 * Element - интерфейс для элементов сцены.
 * Элементы - это модульные компоненты, которые рендерятся на сцене.
 * В отличие от слоев, элементы не содержат логику таймлайна - они получают состояние извне.
 */

import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';

/**
 * Контекст для элемента - предоставляет доступ к viewport и контейнеру.
 */
export interface ElementContext {
  container: PIXI.Container;
  viewport: { getWidth(): number; getHeight(): number };
}

/**
 * Интерфейс элемента сцены.
 */
export interface Element {
  /**
   * Монтирует элемент в контейнер.
   * Вызывается один раз при инициализации элемента.
   */
  mount(context: ElementContext): void;

  /**
   * Обновляет элемент на основе состояния timeline.
   * Вызывается каждый кадр.
   * @param dt - время с последнего кадра в миллисекундах
   * @param state - текущее состояние timeline
   */
  update(dt: number, state: TimelineState): void;

  /**
   * Уничтожает элемент и освобождает ресурсы.
   */
  destroy(): void;
}

