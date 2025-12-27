/**
 * OverlayTextElement - элемент для narrative overlay текста.
 * Миграция из OverlayLayer (только текстовая часть).
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { getNarrativeWindow } from '../timeline';
import type { Layout } from '../renderer/layout/layout';
import { getContainerContext } from '../renderer/containerContext';

export class OverlayTextElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private layout: Layout | null = null;
  private narrativeText: PIXI.Text | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;
    this.layout = context.layout;

    // Narrative text - позиционирование через layout токены
    this.narrativeText = new PIXI.Text('', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: this.layout.typography.h1.fontSize,
      fill: 0xcbd5e1, // slate-300
      align: 'center',
      wordWrap: true,
      wordWrapWidth: this.layout.contentWidth * 0.8, // 80% от контентной ширины
      letterSpacing: -0.02,
    });
    this.narrativeText.anchor.x = 0.5;
    this.narrativeText.anchor.y = 0.5;
    this.narrativeText.x = this.layout.centerX;
    this.narrativeText.y = this.layout.safe.bottom - this.layout.grid * 4; // Отступ от нижнего safe-area
    this.narrativeText.alpha = 0;
    this.container.addChild(this.narrativeText);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.narrativeText || !this.container) return;

    // Обновляем layout из контекста контейнера
    const context = getContainerContext(this.container);
    if (context?.layout) {
      this.layout = context.layout;
      
      // Обновляем позицию и размеры при изменении layout
      this.narrativeText.x = this.layout.centerX;
      this.narrativeText.y = this.layout.safe.bottom - this.layout.grid * 4;
      this.narrativeText.style.fontSize = this.layout.typography.h1.fontSize;
      this.narrativeText.style.wordWrapWidth = this.layout.contentWidth * 0.8;
    }

    if (state.narrativeText) {
      this.narrativeText.text = state.narrativeText;
      
      // Fade in/out logic
      const window = getNarrativeWindow(state.elapsed);
      
      if (window) {
        const FADE_MS = 300;
        const timeInWindow = state.elapsed - window.start;
        const timeUntilEnd = window.end - state.elapsed;
        
        let opacity = 1;
        if (timeInWindow < FADE_MS) {
          opacity = timeInWindow / FADE_MS;
        } else if (timeUntilEnd < FADE_MS) {
          opacity = timeUntilEnd / FADE_MS;
        }
        
        this.narrativeText.alpha = Math.max(0, opacity);
        this.narrativeText.scale.set(0.95 + opacity * 0.05);
      }
    } else {
      this.narrativeText.alpha = 0;
    }
  }

  dispose(): void {
    // Освобождаем ресурсы перед уничтожением
    // Идемпотентный метод - можно вызывать несколько раз
  }

  destroy(): void {
    this.dispose();
    if (this.narrativeText) {
      this.narrativeText.destroy({ children: true });
      this.narrativeText = null;
    }
    this.container = null;
    this.viewport = null;
  }
}

