/**
 * BackgroundLayer - фоновый слой с градиентами и blur эффектами.
 */

import { BaseLayer } from './BaseLayer';
import { TimelineState } from '../../engine/timelineSpec';
import * as PIXI from 'pixi.js';

export class BackgroundLayer extends BaseLayer {
  private blob1: PIXI.Graphics | null = null;
  private blob2: PIXI.Graphics | null = null;

  constructor(container: PIXI.Container, viewport: { getWidth(): number; getHeight(): number }) {
    super(container, viewport);
    this.init();
  }

  private init(): void {
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
    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Blob 1: верхний центр, 800px, blue-900/10, blur 120px
    if (this.blob1) {
      this.blob1.clear();
      const radius = 400; // 800px / 2
      this.blob1.circle(0, 0, radius);
      this.blob1.fill({ color: 0x1e3a8a, alpha: 0.1 }); // blue-900/10
      this.blob1.filters = [
        new PIXI.BlurFilter({ blur: 120 * (width / 1920) }) // Масштабируем blur относительно ширины
      ];
      this.blob1.blendMode = 'screen';
    }

    // Blob 2: нижний правый, 600px, indigo-900/5, blur 100px
    if (this.blob2) {
      this.blob2.clear();
      const radius = 300; // 600px / 2
      this.blob2.circle(0, 0, radius);
      this.blob2.fill({ color: 0x312e81, alpha: 0.05 }); // indigo-900/5
      this.blob2.filters = [
        new PIXI.BlurFilter({ blur: 100 * (width / 1920) })
      ];
      this.blob2.blendMode = 'screen';
    }
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
  }
}

