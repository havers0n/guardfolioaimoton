/**
 * GuardfolioScene - модуль сцены Guardfolio.
 * 
 * @deprecated Этот класс использует старую архитектуру с rendererSingleton.
 * Используйте новую архитектуру вариант C: PlaybackHost, GalleryHost, ExportHost.
 * Каждый Host создаёт и владеет своим renderer.
 * 
 * Инкапсулирует всю логику сцены: engine, renderer, layers, assets.
 * Предоставляет единый контракт для работы со сценой.
 */

import { TimelineEngine } from '../../engine/timelineEngine';
import { TimeSource } from '../../engine/timeSource';
import { EventBus } from '../../engine/eventBus';
import { CanvasRenderer, RendererConfig } from '../../renderer/CanvasRenderer';
// @deprecated rendererSingleton - используйте новую архитектуру вариант C
import { getRenderer, getRendererSync } from '../../renderer/rendererSingleton';
import { AssetLoader, AssetManifest } from '../../engine/assetLoader';
import { type CreateSceneConfig, type SceneMode } from './spec';
import { GUARDFOLIO_ASSETS } from './assets';
import type { TimelineState } from '../../engine/timelineSpec';
import type { SceneState } from './spec';
import type { QualityPreset } from '../../renderer/quality';
import { loadSpec, compileSpec } from '../../engine/spec';
import type { CompiledSpec } from '../../engine/spec';

/**
 * Интерфейс сцены - единый контракт для всех сцен
 */
export interface Scene {
  /**
   * Запускает сцену
   */
  start(): void;
  
  /**
   * Останавливает сцену
   */
  stop(): void;
  
  /**
   * Перемещает timeline на указанное время (в миллисекундах)
   */
  seek(t: number): void;
  
  /**
   * Получает canvas элемент для записи/экспорта
   */
  getCanvas(): HTMLCanvasElement;
  
  /**
   * Получает текущее состояние сцены (SceneState).
   * Владелец: Scene - это единственная точка правды для состояния сцены.
   */
  getState(): SceneState;
  
  /**
   * Проверяет, готова ли сцена к работе
   */
  isReady(): boolean;
  
  /**
   * Проверяет, запущена ли сцена
   */
  isRunning(): boolean;
  
  /**
   * Получает режим работы сцены
   */
  getMode(): SceneMode;
  
  /**
   * Получает quality preset
   */
  getQuality(): QualityPreset;
  
  /**
   * Получает длительность сцены в миллисекундах
   */
  getDuration(): number;
  
  /**
   * Получает TimelineEngine (для расширенного управления, может быть null)
   */
  getEngine(): TimelineEngine | null;
  
  /**
   * Получает CanvasRenderer (для расширенного управления, может быть null)
   */
  getRenderer(): CanvasRenderer | null;
  
  /**
   * Освобождает ресурсы сцены перед уничтожением.
   * Вызывается перед destroy() для корректной очистки.
   * Может быть вызван несколько раз (идемпотентный).
   */
  dispose(): void;

  /**
   * Уничтожает сцену и освобождает ресурсы
   */
  destroy(): void;
}

/**
 * GuardfolioScene - реализация сцены Guardfolio
 */
export class GuardfolioScene implements Scene {
  private engine: TimelineEngine | null = null;
  private renderer: CanvasRenderer | null = null;
  private eventBus: EventBus | null = null;
  private timeSource: TimeSource | null = null;
  private assetLoader: AssetLoader | null = null;
  private container: HTMLElement | null = null;
  private mode: SceneMode = 'playback';
  private quality: QualityPreset = 'high';
  private compiledSpec: CompiledSpec | null = null;
  private isInitialized = false;
  private _isRunning = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Создаёт новую сцену Guardfolio
   */
  static async create(config: CreateSceneConfig): Promise<GuardfolioScene> {
    const scene = new GuardfolioScene();
    await scene.initialize(config);
    return scene;
  }

  /**
   * Приватный конструктор - используйте create()
   */
  private constructor() {}

  /**
   * Инициализирует сцену
   */
  private async initialize(config: CreateSceneConfig): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.container = config.container;
        this.mode = config.mode || 'playback';
        this.quality = (config.quality || 'high') as QualityPreset;

        // 1. Загружаем и компилируем spec
        const specJson = await loadSpec(); // Загружаем default spec (можно передать URL)
        this.compiledSpec = compileSpec(specJson);
        console.log('[GuardfolioScene] Spec loaded and compiled:', {
          name: specJson.metadata.name,
          version: specJson.metadata.version,
          duration: this.compiledSpec.duration,
        });

        // 2. Инициализируем AssetLoader и загружаем ассеты
        this.assetLoader = new AssetLoader();
        await this.assetLoader.load(GUARDFOLIO_ASSETS);

        // 3. Создаём EventBus
        this.eventBus = new EventBus();

        // 4. Создаём TimeSource
        this.timeSource = new TimeSource();

        // 5. Создаём TimelineEngine с compiled spec
        if (!this.timeSource || !this.eventBus || !this.compiledSpec) {
          throw new Error('TimeSource, EventBus or CompiledSpec not initialized');
        }
        this.engine = new TimelineEngine(this.timeSource, this.eventBus, this.compiledSpec);

        // 6. Получаем или создаём CanvasRenderer (singleton)
        const rendererConfig: RendererConfig = {
          container: config.container,
          width: config.width || config.container.clientWidth || window.innerWidth,
          height: config.height || config.container.clientHeight || window.innerHeight,
          backgroundColor: 0x0b1120,
          antialias: true,
          quality: this.quality,
        };

        // Используем singleton - всегда один CanvasRenderer в приложении
        this.renderer = await getRenderer(rendererConfig);
        console.log('[GuardfolioScene] Using CanvasRenderer singleton');

        // 7. Инициализируем элементы через registry (новая система)
        this.renderer.initElements();

        // 8. Подключаем engine к renderer
        if (!this.engine || !this.eventBus) {
          throw new Error('Engine or EventBus not initialized');
        }
        this.renderer.connectEngine(this.engine, this.eventBus);

        // 9. Запускаем render loop (singleton уже запущен при создании)

        this.isInitialized = true;

        console.log('[GuardfolioScene] Scene initialized:', {
          mode: this.mode,
          container: config.container,
          duration: this.compiledSpec.duration,
          phases: this.compiledSpec.phases.length,
        });
      } catch (error) {
        console.error('[GuardfolioScene] Initialization error:', error);
        this.cleanup();
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Запускает сцену
   */
  start(): void {
    if (!this.isInitialized || !this.engine) {
      console.warn('[GuardfolioScene] Cannot start: scene not initialized');
      return;
    }

    if (this._isRunning) {
      console.warn('[GuardfolioScene] Scene already running');
      return;
    }

    this.engine.start();
    this._isRunning = true;

    console.log('[GuardfolioScene] Scene started');
  }

  /**
   * Останавливает сцену
   */
  stop(): void {
    if (!this._isRunning) {
      return;
    }

    if (this.engine) {
      this.engine.stop();
    }

    if (this.renderer) {
      this.renderer.stop();
    }

    this._isRunning = false;

    console.log('[GuardfolioScene] Scene stopped');
  }

  /**
   * Перемещает timeline на указанное время (в миллисекундах)
   */
  seek(t: number): void {
    if (!this.engine || !this.compiledSpec) {
      console.warn('[GuardfolioScene] Cannot seek: engine or compiledSpec not initialized');
      return;
    }

    // Ограничиваем время в пределах длительности сцены
    const clampedTime = Math.max(0, Math.min(t, this.compiledSpec.duration));
    this.engine.seekTo(clampedTime);

    console.log('[GuardfolioScene] Seek to:', clampedTime, 'ms');
  }

  /**
   * Получает canvas элемент для записи/экспорта
   */
  getCanvas(): HTMLCanvasElement {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    return this.renderer.getCanvas();
  }

  /**
   * Получает текущее состояние сцены (SceneState).
   * Владелец: Scene - это единственная точка правды для состояния сцены.
   */
  getState(): SceneState {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }

    return this.engine.getCurrentState();
  }

  /**
   * Проверяет, готова ли сцена к работе
   */
  isReady(): boolean {
    return this.isInitialized && 
           this.renderer?.getIsReady() === true && 
           this.engine !== null;
  }

  /**
   * Проверяет, запущена ли сцена
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Получает режим работы сцены
   */
  getMode(): SceneMode {
    return this.mode;
  }

  /**
   * Получает quality preset
   */
  getQuality(): QualityPreset {
    return this.quality;
  }

  /**
   * Освобождает ресурсы сцены перед уничтожением.
   */
  dispose(): void {
    // НЕ вызываем dispose() на элементах, если используем singleton renderer
    // Элементы будут переиспользоваться новой сценой
    // Renderer живет дольше, чем отдельная сцена
    console.log('[GuardfolioScene] dispose() called (elements preserved for singleton renderer)');
  }

  /**
   * Уничтожает сцену и освобождает ресурсы
   */
  destroy(): void {
    this.dispose();
    this.stop();
    this.cleanup();
    console.log('[GuardfolioScene] Scene destroyed');
  }

  /**
   * Очищает все ресурсы
   */
  private cleanup(): void {
    // НЕ вызываем destroy() на renderer, так как это singleton
    // Renderer живет дольше, чем отдельная сцена
    // Просто отключаем engine и очищаем ссылки
    if (this.renderer && this.engine && this.eventBus) {
      // Отключаем engine от renderer (если есть метод disconnect)
      // Пока просто очищаем ссылки, renderer продолжит работать
    }

    if (this.engine) {
      this.engine.stop();
      this.engine = null;
    }

    if (this.timeSource) {
      this.timeSource = null;
    }

    if (this.eventBus) {
      this.eventBus = null;
    }

    if (this.assetLoader) {
      this.assetLoader.clear();
      this.assetLoader = null;
    }

    this.renderer = null;
    this.container = null;
    this.isInitialized = false;
    this._isRunning = false;
    this.initPromise = null;
  }

  /**
   * Получает EventBus (для подписки на события)
   */
  getEventBus(): EventBus | null {
    return this.eventBus;
  }

  /**
   * Получает TimelineEngine (для расширенного управления)
   */
  getEngine(): TimelineEngine | null {
    return this.engine;
  }

  /**
   * Получает CanvasRenderer (для расширенного управления)
   */
  getRenderer(): CanvasRenderer | null {
    return this.renderer;
  }

  /**
   * Получает список фаз для inspector.
   */
  getPhases(): Array<{ phase: string; fromMs: number; toMs: number }> {
    if (!this.compiledSpec) {
      return [];
    }
    return this.compiledSpec.phases.map(p => ({
      phase: p.phase,
      fromMs: p.fromMs,
      toMs: p.toMs,
    }));
  }

  /**
   * Получает длительность сцены.
   */
  getDuration(): number {
    if (!this.compiledSpec) {
      return 0;
    }
    return this.compiledSpec.duration;
  }

}

/**
 * Фабричная функция для создания сцены Guardfolio
 */
export async function createScene(config: CreateSceneConfig): Promise<Scene> {
  return GuardfolioScene.create(config);
}

