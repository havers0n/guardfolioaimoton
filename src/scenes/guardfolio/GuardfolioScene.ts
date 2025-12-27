/**
 * GuardfolioScene - модуль сцены Guardfolio.
 * 
 * Инкапсулирует всю логику сцены: engine, renderer, layers, assets.
 * Предоставляет единый контракт для работы со сценой.
 */

import { TimelineEngine } from '../../engine/timelineEngine';
import { TimeSource } from '../../engine/timeSource';
import { FixedStepTimeSource } from '../../engine/fixedStepTimeSource';
import { EventBus } from '../../engine/eventBus';
import { CanvasRenderer, RendererConfig } from '../../renderer/CanvasRenderer';
import { AssetLoader, AssetManifest } from '../../engine/assetLoader';
import { GUARDFOLIO_SCENE_SPEC, type CreateSceneConfig, type SceneMode } from './spec';
import { GUARDFOLIO_ASSETS } from './assets';
import type { TimelineState } from '../../engine/timelineSpec';
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
   * Получает текущее состояние timeline
   */
  getState(): TimelineState;
  
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

        // 6. Создаём CanvasRenderer
        const rendererConfig: RendererConfig = {
          container: config.container,
          width: config.width || config.container.clientWidth || window.innerWidth,
          height: config.height || config.container.clientHeight || window.innerHeight,
          backgroundColor: 0x0b1120,
          antialias: true,
          quality: this.quality,
        };

        this.renderer = new CanvasRenderer(rendererConfig);
        await this.renderer.init(rendererConfig);

        // 7. Инициализируем элементы через registry (новая система)
        this.renderer.initElements();

        // 8. Подключаем engine к renderer
        if (!this.engine || !this.eventBus) {
          throw new Error('Engine or EventBus not initialized');
        }
        this.renderer.connectEngine(this.engine, this.eventBus);

        // 9. Запускаем render loop
        this.renderer.start();

        this.isInitialized = true;

        console.log('[GuardfolioScene] Scene initialized:', {
          mode: this.mode,
          container: config.container,
          spec: GUARDFOLIO_SCENE_SPEC.metadata,
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
    if (!this.engine) {
      console.warn('[GuardfolioScene] Cannot seek: engine not initialized');
      return;
    }

    // Ограничиваем время в пределах длительности сцены
    const clampedTime = Math.max(0, Math.min(t, GUARDFOLIO_SCENE_SPEC.duration));
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
   * Получает текущее состояние timeline
   */
  getState(): TimelineState {
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
   * Уничтожает сцену и освобождает ресурсы
   */
  destroy(): void {
    this.stop();
    this.cleanup();
    console.log('[GuardfolioScene] Scene destroyed');
  }

  /**
   * Очищает все ресурсы
   */
  private cleanup(): void {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
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
   * Записывает видео с фиксированными параметрами.
   * Использует fixed-step time source для детерминированной записи.
   * 
   * @returns Promise с Blob видео и метаданными
   */
  async renderVideo(): Promise<{ blob: Blob; meta: VideoRecordingMeta }> {
    if (!this.isReady() || !this.renderer || !this.engine || !this.timeSource) {
      throw new Error('Scene is not ready for recording');
    }

    // Фиксированные параметры записи
    const RECORDING_CONFIG = {
      width: 1920,
      height: 1080,
      fps: 30,
      duration: GUARDFOLIO_SCENE_SPEC.duration,
      bitrate: 25_000_000, // 25 Mbps
      warmupFrames: 15,
    };

    const canvas = this.getCanvas();
    
    // Создаем stream с canvas
    const stream = canvas.captureStream(RECORDING_CONFIG.fps);
    
    // Проверяем наличие video tracks
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      throw new Error('No video tracks in stream');
    }

    // Настраиваем MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
      ? 'video/webm; codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: RECORDING_CONFIG.bitrate,
    });

    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Promise для завершения записи
    const recordingPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onerror = (e) => {
        reject(new Error('MediaRecorder error'));
      };

      mediaRecorder.onstop = () => {
        if (chunks.length === 0) {
          reject(new Error('No data chunks received'));
          return;
        }

        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        resolve(blob);
      };
    });

    // Сохраняем состояние
    const wasRunning = this._isRunning;
    if (wasRunning) {
      this.stop();
    }

    // Сбрасываем timeline в начало
    this.seek(0);

    // Warmup: ждем несколько кадров перед началом записи
    await new Promise(resolve => {
      let frameCount = 0;
      const checkFrames = () => {
        frameCount++;
        if (frameCount >= RECORDING_CONFIG.warmupFrames) {
          resolve(undefined);
        } else {
          requestAnimationFrame(checkFrames);
        }
      };
      requestAnimationFrame(checkFrames);
    });

    // Создаем fixed-step time source для записи
    const recordingTimeSource = new FixedStepTimeSource(
      RECORDING_CONFIG.fps,
      RECORDING_CONFIG.duration
    );
    recordingTimeSource.start();

    // Запускаем запись
    mediaRecorder.start(1000); // timeslice 1 секунда

    // Запускаем render loop с fixed-step time
    const frameTime = recordingTimeSource.getStep();
    let animationFrameId: number | null = null;
    let isRecording = true;
    let lastFrameTime = performance.now();

    const renderFrame = () => {
      if (!isRecording || recordingTimeSource.isFinished()) {
        // Завершаем запись
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            // Останавливаем stream
            stream.getTracks().forEach(track => track.stop());
          }, 200);
        }
        return;
      }

      // Обновляем время через fixed-step
      const currentTime = recordingTimeSource.getElapsed();
      
      // Устанавливаем принудительное время в time source
      this.timeSource.setForcedTime(currentTime);

      // Обновляем engine через seek
      this.engine.seekTo(currentTime);

      // Переходим к следующему шагу
      const hasNext = recordingTimeSource.next();

      if (!hasNext) {
        isRecording = false;
      }

      // Планируем следующий кадр с учетом FPS
      const now = performance.now();
      const elapsed = now - lastFrameTime;
      const delay = Math.max(0, frameTime - elapsed);
      lastFrameTime = now;

      if (delay > 0) {
        animationFrameId = setTimeout(() => {
          requestAnimationFrame(renderFrame);
        }, delay) as any;
      } else {
        animationFrameId = requestAnimationFrame(renderFrame) as any;
      }
    };

    // Запускаем render loop
    requestAnimationFrame(renderFrame);

    // Ждем завершения записи
    const blob = await recordingPromise;

    // Очищаем
    if (animationFrameId !== null) {
      clearTimeout(animationFrameId);
    }
    isRecording = false;

    // Восстанавливаем time source
    this.timeSource.setForcedTime(null);

    // Восстанавливаем состояние
    if (wasRunning) {
      this.start();
    }

    // Метаданные записи
    const meta: VideoRecordingMeta = {
      width: RECORDING_CONFIG.width,
      height: RECORDING_CONFIG.height,
      fps: RECORDING_CONFIG.fps,
      duration: RECORDING_CONFIG.duration,
      bitrate: RECORDING_CONFIG.bitrate,
      format: mimeType,
      size: blob.size,
      timestamp: Date.now(),
    };

    return { blob, meta };
  }
}

/**
 * Метаданные записи видео
 */
export interface VideoRecordingMeta {
  width: number;
  height: number;
  fps: number;
  duration: number;
  bitrate: number;
  format: string;
  size: number;
  timestamp: number;
}

/**
 * Фабричная функция для создания сцены Guardfolio
 */
export async function createScene(config: CreateSceneConfig): Promise<Scene> {
  return GuardfolioScene.create(config);
}

