/**
 * OverlayTextElement - элемент для narrative overlay текста.
 * Миграция из OverlayLayer (только текстовая часть).
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { getNarrativeWindow } from '../timeline';

export class OverlayTextElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private narrativeText: PIXI.Text | null = null;

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Narrative text
    this.narrativeText = new PIXI.Text('', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 48,
      fill: 0xcbd5e1, // slate-300
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 800,
      letterSpacing: -0.02,
    });
    this.narrativeText.anchor.x = 0.5;
    this.narrativeText.anchor.y = 0.5;
    this.narrativeText.x = width / 2;
    this.narrativeText.y = height * 0.85; // Lower third
    this.narrativeText.alpha = 0;
    this.container.addChild(this.narrativeText);
  }

  update(dt: number, state: TimelineState): void {
    if (!this.narrativeText) return;

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

  destroy(): void {
    if (this.narrativeText) {
      this.narrativeText.destroy({ children: true });
      this.narrativeText = null;
    }
    this.container = null;
    this.viewport = null;
  }
}

