/**
 * BackgroundElement - элемент фона с градиентами и blur эффектами.
 * Миграция из BackgroundLayer.
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import type { Layout } from '../renderer/layout/layout';
import { getContainerContext } from '../renderer/containerContext';

export class BackgroundElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private layout: Layout | null = null;
  private blob1: PIXI.Graphics | null = null;
  private blob2: PIXI.Graphics | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;
    this.layout = context.layout;

    // Blob 1 - верхний центр (через layout.centerX)
    this.blob1 = new PIXI.Graphics();
    this.blob1.x = this.layout.centerX;
    this.blob1.y = 0;
    this.container.addChild(this.blob1);

    // Blob 2 - нижний правый (через layout.safe.right и layout.safe.bottom)
    this.blob2 = new PIXI.Graphics();
    this.blob2.x = this.layout.safe.right;
    this.blob2.y = this.layout.safe.bottom;
    this.container.addChild(this.blob2);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.viewport || !this.blob1 || !this.blob2 || !this.container) return;

    // Обновляем layout из контекста контейнера
    const context = getContainerContext(this.container);
    if (context?.layout) {
      this.layout = context.layout;
      
      // Обновляем позиции blobs при изменении layout
      this.blob1.x = this.layout.centerX;
      this.blob2.x = this.layout.safe.right;
      this.blob2.y = this.layout.safe.bottom;
    }
    
    if (!this.layout) return;

    // Blob 1: верхний центр, размер через layout.scale
    this.blob1.clear();
    const radius = 400 * this.layout.scale; // Масштабируем через layout
    this.blob1.circle(0, 0, radius);
    this.blob1.fill({ color: 0x1e3a8a, alpha: 0.1 }); // blue-900/10
    this.blob1.filters = [
      new PIXI.BlurFilter({ blur: 120 * this.layout.scale }) // Масштабируем через layout
    ];
    this.blob1.blendMode = 'screen';

    // Blob 2: нижний правый, размер через layout.scale
    this.blob2.clear();
    const radius2 = 300 * this.layout.scale; // Масштабируем через layout
    this.blob2.circle(0, 0, radius2);
    this.blob2.fill({ color: 0x312e81, alpha: 0.05 }); // indigo-900/5
    this.blob2.filters = [
      new PIXI.BlurFilter({ blur: 100 * this.layout.scale }) // Масштабируем через layout
    ];
    this.blob2.blendMode = 'screen';
  }

  dispose(): void {
    // Освобождаем ресурсы перед уничтожением
    // Идемпотентный метод - можно вызывать несколько раз
  }

  destroy(): void {
    this.dispose();
    if (this.blob1) {
      this.blob1.destroy({ children: true });
      this.blob1 = null;
    }
    if (this.blob2) {
      this.blob2.destroy({ children: true });
      this.blob2 = null;
    }
    this.container = null;
    this.viewport = null;
  }
}

