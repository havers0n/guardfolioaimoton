/**
 * GuardfolioVideoProgram - программа для видео Guardfolio.
 * 
 * Видео = набор сцен/шотов с переходами.
 * 
 * Структура:
 * - Intro (3s) - header + background
 * - Analysis (3s) - chart + overlay
 * - Reveal (3s) - tasks + beam
 * - Clarity (3s) - "analysis complete"
 * - Brand (3s) - logo + tagline
 * - Outro (3s) - fade out
 */

import type { Program, SceneDef, SceneState, Transition } from '../types';
import type { ElementConfig } from '../../elements/registry';
import type { CompiledSpec } from '../../engine/spec';
import { loadSpec, compileSpec } from '../../engine/spec';
import { DEFAULT_ELEMENTS } from '../../elements/registry';

/**
 * GuardfolioVideoProgram - реализация программы для видео.
 */
export class GuardfolioVideoProgram implements Program {
  private scenes: SceneDef[] = [];
  private transitions: Transition[] = [];
  private totalDuration: number = 0;
  private compiledSpec: CompiledSpec | null = null;

  /**
   * Создаёт новую программу для видео Guardfolio.
   */
  static async create(): Promise<GuardfolioVideoProgram> {
    const program = new GuardfolioVideoProgram();
    await program.initialize();
    return program;
  }

  private constructor() {}

  /**
   * Инициализирует программу: загружает spec и создаёт сцены.
   */
  private async initialize(): Promise<void> {
    // Загружаем и компилируем spec
    const specJson = await loadSpec();
    this.compiledSpec = compileSpec(specJson);

    // Создаём сцены (шоты) на основе spec
    // Пока используем одну сцену на весь spec, но можно разбить на шоты
    const sceneDef: SceneDef = {
      id: 'guardfolio-main',
      durationMs: this.compiledSpec.duration,
      spec: this.compiledSpec,
      elements: DEFAULT_ELEMENTS,
      enter: {
        fadeIn: false,
      },
      exit: {
        fadeOut: false,
      },
    };

    this.scenes = [sceneDef];
    this.totalDuration = this.compiledSpec.duration;

    console.log('[GuardfolioVideoProgram] Initialized:', {
      scenes: this.scenes.length,
      duration: this.totalDuration,
    });
  }

  /**
   * Получает активную сцену для указанного времени.
   */
  getSceneAt(timeMs: number): SceneState | null {
    // Ограничиваем время в пределах длительности программы
    const clampedTime = Math.max(0, Math.min(timeMs, this.totalDuration));

    // Находим активную сцену
    let accumulatedTime = 0;
    for (const scene of this.scenes) {
      if (clampedTime >= accumulatedTime && clampedTime < accumulatedTime + scene.durationMs) {
        const sceneTime = clampedTime - accumulatedTime;
        return {
          sceneId: scene.id,
          sceneTime,
          programTime: clampedTime,
          timelineState: null, // Будет вычисляться через TimelineEngine
        };
      }
      accumulatedTime += scene.durationMs;
    }

    return null;
  }

  /**
   * Получает конфигурацию элементов для указанной сцены.
   */
  getElementsForScene(sceneId: string): ElementConfig[] {
    const scene = this.scenes.find(s => s.id === sceneId);
    return scene?.elements || [];
  }

  /**
   * Получает общую спецификацию программы.
   */
  getSpec(): CompiledSpec | null {
    return this.compiledSpec;
  }

  /**
   * Получает общую длительность программы.
   */
  getDuration(): number {
    return this.totalDuration;
  }

  /**
   * Получает все определения сцен программы.
   */
  getScenes(): SceneDef[] {
    return this.scenes;
  }
}

