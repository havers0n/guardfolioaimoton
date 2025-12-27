/**
 * Quality - система управления качеством рендеринга.
 * Позволяет деградировать эффекты по quality preset.
 */

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityConfig {
  preset: QualityPreset;
  blurEnabled: boolean;
  antialias: boolean;
  resolution: number;
  particleCount: number;
  noiseEnabled: boolean;
}

const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  low: {
    preset: 'low',
    blurEnabled: false, // Используем alpha overlay вместо blur
    antialias: false,
    resolution: 1,
    particleCount: 50,
    noiseEnabled: false,
  },
  medium: {
    preset: 'medium',
    blurEnabled: false, // Alpha overlay
    antialias: true,
    resolution: 1,
    particleCount: 100,
    noiseEnabled: true,
  },
  high: {
    preset: 'high',
    blurEnabled: true, // Настоящий blur
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    particleCount: 200,
    noiseEnabled: true,
  },
  ultra: {
    preset: 'ultra',
    blurEnabled: true,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    particleCount: 500,
    noiseEnabled: true,
  },
};

export class QualityManager {
  private currentPreset: QualityPreset;
  private config: QualityConfig;

  constructor(preset: QualityPreset = 'high') {
    this.currentPreset = preset;
    this.config = { ...QUALITY_PRESETS[preset] };
  }

  /**
   * Устанавливает quality preset.
   */
  setPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
    this.config = { ...QUALITY_PRESETS[preset] };
  }

  /**
   * Получает текущую конфигурацию качества.
   */
  getConfig(): QualityConfig {
    return { ...this.config };
  }

  /**
   * Применяет blur через alpha overlay (fallback когда blur отключен).
   */
  applyBlurFallback(alpha: number, blurAmount: number): number {
    if (this.config.blurEnabled) {
      return alpha; // Используем настоящий blur
    }
    // Fallback: увеличиваем прозрачность для имитации blur
    return Math.min(1, alpha * (1 + blurAmount * 0.1));
  }

  /**
   * Получает количество частиц для эффектов.
   */
  getParticleCount(): number {
    return this.config.particleCount;
  }

  /**
   * Проверяет, включен ли noise.
   */
  isNoiseEnabled(): boolean {
    return this.config.noiseEnabled;
  }
}

