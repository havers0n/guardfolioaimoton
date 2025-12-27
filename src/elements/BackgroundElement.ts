/**
 * BackgroundElement - элемент фона с градиентами и blur эффектами.
 * Миграция из BackgroundLayer.
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';

export class BackgroundElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private blob1: PIXI.Graphics | null = null;
  private blob2: PIXI.Graphics | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Blob 1 - верхний центр
    this.blob1 = new PIXI.Graphics();
    this.blob1.x = width / 2;
    this.blob1.y = 0;
    this.container.addChild(this.blob1);

    // Blob 2 - нижний правый
    this.blob2 = new PIXI.Graphics();
    this.blob2.x = width;
    this.blob2.y = height;
    this.container.addChild(this.blob2);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.viewport || !this.blob1 || !this.blob2) return;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Blob 1: верхний центр, 800px, blue-900/10, blur 120px
    this.blob1.clear();
    const radius = 400; // 800px / 2
    this.blob1.circle(0, 0, radius);
    this.blob1.fill({ color: 0x1e3a8a, alpha: 0.1 }); // blue-900/10
    this.blob1.filters = [
      new PIXI.BlurFilter({ blur: 120 * (width / 1920) }) // Масштабируем blur относительно ширины
    ];
    this.blob1.blendMode = 'screen';

    // Blob 2: нижний правый, 600px, indigo-900/5, blur 100px
    this.blob2.clear();
    const radius2 = 300; // 600px / 2
    this.blob2.circle(0, 0, radius2);
    this.blob2.fill({ color: 0x312e81, alpha: 0.05 }); // indigo-900/5
    this.blob2.filters = [
      new PIXI.BlurFilter({ blur: 100 * (width / 1920) })
    ];
    this.blob2.blendMode = 'screen';
  }

  destroy(): void {
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

