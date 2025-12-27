/**
 * LogoElement - элемент для финального логотипа бренда.
 * Миграция из LogoLayer.
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { BRAND, TAGLINE } from '../constants';
import type { Layout } from '../renderer/layout/layout';
import { getContainerContext } from '../renderer/containerContext';

export class LogoElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private layout: Layout | null = null;
  private brandText: PIXI.Text | null = null;
  private taglineText: PIXI.Text | null = null;
  private blob1: PIXI.Graphics | null = null;
  private blob2: PIXI.Graphics | null = null;
  private containerGroup: PIXI.Container | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;
    this.layout = context.layout;

    // Группа для всего логотипа (для масштабирования)
    // Позиционирование через layout: центр по X, Y = safe.bottom - отступ
    this.containerGroup = new PIXI.Container();
    this.containerGroup.x = this.layout.centerX;
    this.containerGroup.y = this.layout.safe.bottom - this.layout.grid * 6; // Отступ от нижнего safe-area
    this.container.addChild(this.containerGroup);

    // Brand text with gradient - используем типографию из layout
    // В Pixi v8 градиент для текста создается через объект GradientFill
    this.brandText = new PIXI.Text(BRAND, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: this.layout.typography.h1.fontSize * 1.5, // Увеличенный H1
      fill: {
        type: 'linear',
        stops: [
          { offset: 0, color: 0x3b82f6 }, // blue-500
          { offset: 1, color: 0x8b5cf6 }, // purple-500
        ],
      },
      fontWeight: 'bold',
      letterSpacing: 0.02,
      align: 'center',
    });
    this.brandText.anchor.x = 0.5;
    this.brandText.anchor.y = 0.5;
    this.brandText.y = -this.layout.grid * 2.5; // Отступ через grid
    this.containerGroup.addChild(this.brandText);

    // Tagline text - используем типографию из layout
    this.taglineText = new PIXI.Text(TAGLINE, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: this.layout.typography.body.fontSize,
      fill: 0xcbd5e1, // slate-300 (светлее для лучшей видимости)
      fontWeight: '300',
      letterSpacing: 0.02,
      align: 'center',
    });
    this.taglineText.anchor.x = 0.5;
    this.taglineText.anchor.y = 0.5;
    this.taglineText.y = this.layout.grid * 1.25; // Отступ через grid
    this.taglineText.alpha = 0;
    this.containerGroup.addChild(this.taglineText);

    // Decorative blobs - размеры через layout.scale
    const blob1Radius = 192 * this.layout.scale;
    const blob2Radius = 128 * this.layout.scale;
    
    this.blob1 = new PIXI.Graphics();
    this.blob1.circle(0, 0, blob1Radius);
    this.blob1.fill({ color: 0x3b82f6, alpha: 0.1 });
    this.blob1.filters = [new PIXI.BlurFilter({ blur: 48 * this.layout.scale })];
    this.blob1.alpha = 0;
    this.containerGroup.addChild(this.blob1);

    this.blob2 = new PIXI.Graphics();
    this.blob2.circle(0, 0, blob2Radius);
    this.blob2.fill({ color: 0x8b5cf6, alpha: 0.1 }); // purple-500/10
    this.blob2.filters = [new PIXI.BlurFilter({ blur: 32 * this.layout.scale })];
    this.blob2.alpha = 0;
    this.containerGroup.addChild(this.blob2);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.containerGroup || !this.brandText || !this.taglineText || !this.container) return;

    // Обновляем layout из контекста контейнера
    const context = getContainerContext(this.container);
    if (context?.layout && context.layout !== this.layout) {
      this.layout = context.layout;
      
      // Обновляем позицию и размеры при изменении layout
      this.containerGroup.x = this.layout.centerX;
      this.containerGroup.y = this.layout.safe.bottom - this.layout.grid * 6;
      
      // Обновляем размеры текста
      this.brandText.style.fontSize = this.layout.typography.h1.fontSize * 1.5;
      this.brandText.y = -this.layout.grid * 2.5;
      
      this.taglineText.style.fontSize = this.layout.typography.body.fontSize;
      this.taglineText.y = this.layout.grid * 1.25;
      
      // Обновляем размеры blobs
      if (this.blob1) {
        const blob1Radius = 192 * this.layout.scale;
        this.blob1.clear();
        this.blob1.circle(0, 0, blob1Radius);
        this.blob1.fill({ color: 0x3b82f6, alpha: 0.1 });
        this.blob1.filters = [new PIXI.BlurFilter({ blur: 48 * this.layout.scale })];
      }
      
      if (this.blob2) {
        const blob2Radius = 128 * this.layout.scale;
        this.blob2.clear();
        this.blob2.circle(0, 0, blob2Radius);
        this.blob2.fill({ color: 0x8b5cf6, alpha: 0.1 });
        this.blob2.filters = [new PIXI.BlurFilter({ blur: 32 * this.layout.scale })];
      }
    }

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

  dispose(): void {
    // Освобождаем ресурсы перед уничтожением
    // Идемпотентный метод - можно вызывать несколько раз
  }

  destroy(): void {
    this.dispose();
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

