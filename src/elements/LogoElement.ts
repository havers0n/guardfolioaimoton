/**
 * LogoElement - элемент для финального логотипа бренда.
 * Миграция из LogoLayer.
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { BRAND, TAGLINE } from '../constants';

export class LogoElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private brandText: PIXI.Text | null = null;
  private taglineText: PIXI.Text | null = null;
  private blob1: PIXI.Graphics | null = null;
  private blob2: PIXI.Graphics | null = null;
  private containerGroup: PIXI.Container | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Группа для всего логотипа (для масштабирования)
    this.containerGroup = new PIXI.Container();
    this.containerGroup.x = width / 2;
    this.containerGroup.y = height / 2;
    this.container.addChild(this.containerGroup);

    // Brand text
    this.brandText = new PIXI.Text(BRAND, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 72,
      fill: 0x3b82f6, // blue-500 (будет градиент)
      fontWeight: 'bold',
      letterSpacing: 0.02,
      align: 'center',
    });
    this.brandText.anchor.x = 0.5;
    this.brandText.anchor.y = 0.5;
    this.brandText.y = -40;
    this.containerGroup.addChild(this.brandText);

    // Tagline text
    this.taglineText = new PIXI.Text(TAGLINE, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 24,
      fill: 0x94a3b8, // slate-400
      fontWeight: '300',
      letterSpacing: 0.02,
      align: 'center',
    });
    this.taglineText.anchor.x = 0.5;
    this.taglineText.anchor.y = 0.5;
    this.taglineText.y = 20;
    this.taglineText.alpha = 0;
    this.containerGroup.addChild(this.taglineText);

    // Decorative blobs
    this.blob1 = new PIXI.Graphics();
    this.blob1.circle(0, 0, 192); // 384px / 2
    this.blob1.fill({ color: 0x3b82f6, alpha: 0.1 });
    this.blob1.filters = [new PIXI.BlurFilter({ blur: 48 })]; // blur-3xl
    this.blob1.alpha = 0;
    this.containerGroup.addChild(this.blob1);

    this.blob2 = new PIXI.Graphics();
    this.blob2.circle(0, 0, 128); // 256px / 2
    this.blob2.fill({ color: 0x8b5cf6, alpha: 0.1 }); // purple-500/10
    this.blob2.filters = [new PIXI.BlurFilter({ blur: 32 })]; // blur-2xl
    this.blob2.alpha = 0;
    this.containerGroup.addChild(this.blob2);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.containerGroup || !this.brandText || !this.taglineText) return;

    const progress = state.brandProgress;
    if (progress <= 0) {
      this.containerGroup.alpha = 0;
      return;
    }

    // Easing function
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedP = easeOut(progress);

    // Growth Animation: Start from scale 0.5 (center of implosion)
    const scale = 0.5 + 0.5 * easedP; // 0.5 -> 1.0
    const opacity = progress; // 0 -> 1

    this.containerGroup.scale.set(scale);
    this.containerGroup.alpha = opacity;

    // Tagline appears after 30% of progress
    const taglineP = Math.max(0, (progress - 0.3) / 0.7);
    const taglineOpacity = easeOut(taglineP) * 0.9;
    if (this.taglineText) {
      this.taglineText.alpha = taglineOpacity;
    }

    // Blob opacities
    const blob1Opacity = Math.min(0.6, progress * 0.6);
    const blob2Opacity = Math.min(0.5, Math.max(0, (progress - 0.2) * 0.5));

    if (this.blob1) {
      this.blob1.alpha = blob1Opacity;
    }
    if (this.blob2) {
      this.blob2.alpha = blob2Opacity;
    }
  }

  destroy(): void {
    if (this.containerGroup) {
      this.containerGroup.destroy({ children: true });
      this.containerGroup = null;
    }
    this.brandText = null;
    this.taglineText = null;
    this.blob1 = null;
    this.blob2 = null;
    this.container = null;
    this.viewport = null;
  }
}

