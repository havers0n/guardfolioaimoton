/**
 * ExportProgram - программа для экспорта видео.
 * 
 * Аналогична VideoProgram, но с поддержкой fixed-step time source.
 */

import type { Program, SceneDef, SceneState } from '../types';
import type { ElementConfig } from '../../elements/registry';
import type { CompiledSpec } from '../../engine/spec';
import { loadSpec, compileSpec } from '../../engine/spec';
import { DEFAULT_ELEMENTS } from '../../elements/registry';

/**
 * ExportProgram - реализация программы для экспорта.
 */
export class ExportProgram implements Program {
  private scene: SceneDef;
  private compiledSpec: CompiledSpec | null = null;

  /**
   * Создаёт новую программу для экспорта.
   */
  static async create(): Promise<ExportProgram> {
    const program = new ExportProgram();
    await program.initialize();
    return program;
  }

  private constructor() {}

  /**
   * Инициализирует программу: загружает spec и создаёт сцену.
   */
  private async initialize(): Promise<void> {
    // Загружаем и компилируем spec
    const specJson = await loadSpec();
    this.compiledSpec = compileSpec(specJson);

    // Создаём одну сцену для экспорта
    this.scene = {
      id: 'export-main',
      durationMs: this.compiledSpec.duration,
      spec: this.compiledSpec,
      elements: DEFAULT_ELEMENTS,
    };

    console.log('[ExportProgram] Initialized:', {
      sceneId: this.scene.id,
      duration: this.scene.durationMs,
      elements: this.scene.elements.length,
    });
  }

  /**
   * Получает активную сцену для указанного времени.
   */
  getSceneAt(timeMs: number): SceneState | null {
    const clampedTime = Math.max(0, Math.min(timeMs, this.scene.durationMs));
    return {
      sceneId: this.scene.id,
      sceneTime: clampedTime,
      programTime: clampedTime,
      timelineState: null,
    };
  }

  /**
   * Получает конфигурацию элементов для указанной сцены.
   */
  getElementsForScene(sceneId: string): ElementConfig[] {
    if (sceneId === this.scene.id) {
      return this.scene.elements;
    }
    return [];
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
    return this.scene.durationMs;
  }

  /**
   * Получает все определения сцен программы.
   */
  getScenes(): SceneDef[] {
    return [this.scene];
  }
}

