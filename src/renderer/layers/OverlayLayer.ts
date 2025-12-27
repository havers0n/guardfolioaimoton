/**
 * OverlayLayer - слой для narrative overlay и визуальных эффектов (noise, scanlines, vignette).
 * Миграция из NarrativeOverlay и VisualEffects компонентов.
 */

import { BaseLayer } from './BaseLayer';
import { TimelineState, TIMELINE_SPEC } from '../../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { RNG } from '../../engine/rng';

export class OverlayLayer extends BaseLayer {
  private narrativeText: PIXI.Text | null = null;
  private noiseTexture: PIXI.Texture | null = null;
  private noiseSprite: PIXI.Sprite | null = null;
  private scanlineSprite: PIXI.Sprite | null = null;
  private vignetteSprite: PIXI.Sprite | null = null;
  private rng: RNG;

  constructor(container: PIXI.Container, viewport: { getWidth(): number; getHeight(): number }) {
    super(container, viewport);
    this.rng = new RNG(12345);
    this.init();
  }

  private init(): void {
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
    this.narrativeText.anchor.set(0.5);
    this.narrativeText.x = width / 2;
    this.narrativeText.y = height * 0.85; // Lower third
    this.narrativeText.alpha = 0;
    this.container.addChild(this.narrativeText);

    // Noise texture
    this.createNoiseTexture(width, height);

    // Scanlines
    this.createScanlines(width, height);

    // Vignette
    this.createVignette(width, height);
  }

  private createNoiseTexture(width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(this.rng.random() * 128);
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255;   // A (будет контролироваться через alpha)
    }

    ctx.putImageData(imageData, 0, 0);
    this.noiseTexture = PIXI.Texture.from(canvas);
    this.noiseSprite = new PIXI.Sprite(this.noiseTexture);
    this.noiseSprite.blendMode = 'multiply';
    this.noiseSprite.alpha = 0;
    this.container.addChild(this.noiseSprite);
  }

  private createScanlines(width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 4);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.2)');

    ctx.fillStyle = gradient;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 4);
    }

    const texture = PIXI.Texture.from(canvas);
    this.scanlineSprite = new PIXI.Sprite(texture);
    this.scanlineSprite.alpha = 0;
    this.container.addChild(this.scanlineSprite);
  }

  private createVignette(width: number, height: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.3,
      width / 2, height / 2, width * 0.5
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(11,17,32,0.6)'); // #0b1120

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const texture = PIXI.Texture.from(canvas);
    this.vignetteSprite = new PIXI.Sprite(texture);
    this.container.addChild(this.vignetteSprite);
  }

  update(dt: number, state: TimelineState): void {
    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Narrative text
    if (this.narrativeText) {
      if (state.narrativeText) {
        this.narrativeText.text = state.narrativeText;
        
        // Fade in/out logic
        const window = state.narrativeText ? 
          TIMELINE_SPEC.narrativeWindows.find(w => w.text === state.narrativeText) : null;
        
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

    // Visual effects based on macro phase
    let noiseOpacity = 0;
    let scanlineOpacity = 0;

    switch (state.macroPhase) {
      case 'SIGNAL':
        noiseOpacity = 0.05;
        break;
      case 'INTERPRETATION':
        noiseOpacity = 0.08;
        scanlineOpacity = 0.05;
        break;
      case 'STRUCTURE':
        noiseOpacity = 0.06;
        scanlineOpacity = 0.03;
        break;
      case 'CLARITY':
        noiseOpacity = 0.02;
        scanlineOpacity = 0;
        break;
    }

    // Fade out at the end
    if (state.elapsed > 25000) {
      noiseOpacity = 0;
    }

    if (this.noiseSprite) {
      this.noiseSprite.alpha = noiseOpacity;
    }

    if (this.scanlineSprite) {
      this.scanlineSprite.alpha = scanlineOpacity;
    }

    // Vignette всегда присутствует
    // (уже создан с нужной прозрачностью)
  }

  destroy(): void {
    if (this.narrativeText) {
      this.narrativeText.destroy({ children: true });
      this.narrativeText = null;
    }
    if (this.noiseSprite) {
      this.noiseSprite.destroy({ children: true });
      this.noiseSprite = null;
    }
    if (this.noiseTexture) {
      this.noiseTexture.destroy();
      this.noiseTexture = null;
    }
    if (this.scanlineSprite) {
      this.scanlineSprite.destroy({ children: true });
      this.scanlineSprite = null;
    }
    if (this.vignetteSprite) {
      this.vignetteSprite.destroy({ children: true });
      this.vignetteSprite = null;
    }
  }
}

