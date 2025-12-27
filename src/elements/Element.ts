/**
 * Element - интерфейс для элементов сцены.
 * Элементы - это модульные компоненты, которые рендерятся на сцене.
 * В отличие от слоев, элементы не содержат логику таймлайна - они получают состояние извне.
 */

import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import type { Layout } from '../renderer/layout/layout';

/**
 * Контекст для элемента - предоставляет доступ к viewport, контейнеру и layout.
 */
export interface ElementContext {
  container: PIXI.Container;
  viewport: { getWidth(): number; getHeight(): number };
  layout: Layout;
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
   * Освобождает ресурсы элемента перед уничтожением.
   * Вызывается перед destroy() для корректной очистки.
   * Может быть вызван несколько раз (идемпотентный).
   */
  dispose(): void;

  /**
   * Уничтожает элемент и освобождает ресурсы.
   * Вызывается при полном уничтожении элемента.
   */
  destroy(): void;
}

