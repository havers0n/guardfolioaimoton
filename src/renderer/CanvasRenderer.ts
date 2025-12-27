/**
 * CanvasRenderer - основной рендерер на базе PixiJS.
 * Управляет всеми слоями и RAF циклом.
 */

import { Application, Container } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { Viewport } from './viewport';
import { BaseLayer } from './layers/BaseLayer';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { ChartLayer } from './layers/ChartLayer';
import { OverlayLayer } from './layers/OverlayLayer';
import { LogoLayer } from './layers/LogoLayer';
import { UILayer, UILayerConfig } from './layers/UILayer';
import { TimelineState, ChartRole } from '../engine/timelineSpec';
import { Phase, MacroPhase } from '../constants';
import { TimelineEngine } from '../engine/timelineEngine';
import { EventBus } from '../engine/eventBus';
import { QualityManager, QualityPreset } from './quality';

export interface RendererConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  quality?: QualityPreset;
}

export class CanvasRenderer {
  private app?: Application;
  private viewport: Viewport;
  private layers: BaseLayer[] = [];
  private backgroundLayer: BackgroundLayer | null = null;
  private chartLayer: ChartLayer | null = null;
  private overlayLayer: OverlayLayer | null = null;
  private logoLayer: LogoLayer | null = null;
  private uiLayer: UILayer | null = null;
  private rafId: number | null = null;
  private isRunning = false;
  private lastTime = 0;
  private currentState: TimelineState | null = null;
  private engine: TimelineEngine | null = null;
  private eventBus: EventBus | null = null;
  private qualityManager: QualityManager;
  private mounted = false;
  private isReady = false;
  private initialized = false; // Флаг полной инициализации после await app.init()
  private initPromise: Promise<void> | null = null; // Promise для идемпотентности init()
  private resizeHandler?: () => void;

  constructor(config: RendererConfig) {
    const width = config.width || config.container.clientWidth || 1920;
    const height = config.height || config.container.clientHeight || 1080;
    
    this.qualityManager = new QualityManager(config.quality || 'high');
    const qualityConfig = this.qualityManager.getConfig();
    
    this.viewport = new Viewport({
      width,
      height,
      pixelRatio: qualityConfig.resolution,
    });
  }

  /**
   * Инициализирует PixiJS Application (async для v8).
   * Идемпотентный: повторные вызовы возвращают тот же Promise.
   */
  async init(config: RendererConfig): Promise<void> {
    // Если уже инициализирован, возвращаем существующий Promise или просто return
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.mounted || this.isReady || this.initialized) {
      // Уже инициализирован синхронно
      return Promise.resolve();
    }

    // Создаем Promise для идемпотентности (StrictMode safe)
    this.initPromise = (async () => {
      const width = this.viewport.getWidth();
      const height = this.viewport.getHeight();
      const qualityConfig = this.qualityManager.getConfig();

      try {
        // 1) Создаем Application без опций
        const app = new Application();
        this.app = app;

        // 2) Обязательно await init()
        await app.init({
          width,
          height,
          backgroundColor: config.backgroundColor ?? 0x0b1120, // #0b1120
          antialias: config.antialias ?? qualityConfig.antialias,
          resolution: config.resolution ?? qualityConfig.resolution,
          autoDensity: true,
        });

        // 3) После init canvas гарантированно есть
        if (!app.canvas) {
          throw new Error('Pixi app.canvas is undefined after init()');
        }

        // 4) Устанавливаем флаг инициализации ПЕРЕД добавлением в DOM
        this.initialized = true;

        // 5) Добавляем canvas в DOM
        config.container.appendChild(app.canvas);

        // 6) Инициализируем слои (теперь это безопасно)
        this.initLayers();

        // 7) Обработка изменения размера
        this.resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this.resizeHandler);

        this.mounted = true;
        this.isReady = true;

        // Диагностический лог после полной инициализации
        if (this.app && this.app.canvas) {
          console.log('CanvasRenderer initialized:', {
            canvasWidth: this.app.canvas.width,
            canvasHeight: this.app.canvas.height,
            isConnected: this.app.canvas.isConnected,
            hasRenderer: !!this.app.renderer,
            hasStage: !!this.app.stage,
          });
        }
      } catch (error) {
        // При ошибке сбрасываем состояние
        this.initialized = false;
        this.app = undefined;
        this.initPromise = null; // Сбрасываем Promise для возможности повторной попытки
        throw error;
      }
    })();

    return this.initPromise;
  }

  private initLayers(): void {
    // Проверка: initLayers() может вызываться только после await app.init()
    // В dev (StrictMode) лучше return вместо throw, чтобы не сыпать ошибками
    if (!this.initialized || !this.app) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cannot init layers: app is not initialized. Skipping (StrictMode safe).');
        return;
      }
      // В production всё равно throw для безопасности
      throw new Error('Cannot init layers: app is not initialized. Call initLayers() only after await app.init() completes.');
    }

    // Дополнительная проверка на наличие renderer и stage
    if (!this.app.renderer || !this.app.stage) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cannot init layers: app.renderer or app.stage is not available. Skipping.');
        return;
      }
      throw new Error('Cannot init layers: app.renderer or app.stage is not available');
    }

    // Создаем корневой контейнер для всех слоев
    const rootContainer = new Container();
    this.app.stage.addChild(rootContainer);
    console.log('Initializing layers, stage children:', this.app.stage.children.length);

    // Background Layer (z-index 0)
    const backgroundContainer = new Container();
    rootContainer.addChild(backgroundContainer);
    this.backgroundLayer = new BackgroundLayer(backgroundContainer, this.viewport);
    this.layers.push(this.backgroundLayer);

    // Chart Layer (z-index 1)
    const chartContainer = new Container();
    rootContainer.addChild(chartContainer);
    this.chartLayer = new ChartLayer(chartContainer, this.viewport);
    this.layers.push(this.chartLayer);

    // UI Layer (z-index 10)
    const uiContainer = new Container();
    rootContainer.addChild(uiContainer);
    this.uiLayer = new UILayer(uiContainer, this.viewport);
    this.layers.push(this.uiLayer);

    // Overlay Layer (z-index 20)
    const overlayContainer = new Container();
    rootContainer.addChild(overlayContainer);
    this.overlayLayer = new OverlayLayer(overlayContainer, this.viewport);
    this.layers.push(this.overlayLayer);

    // Logo Layer (z-index 30)
    const logoContainer = new Container();
    rootContainer.addChild(logoContainer);
    this.logoLayer = new LogoLayer(logoContainer, this.viewport);
    this.layers.push(this.logoLayer);

    console.log('Layers initialized:', {
      total: this.layers.length,
      background: !!this.backgroundLayer,
      chart: !!this.chartLayer,
      ui: !!this.uiLayer,
      overlay: !!this.overlayLayer,
      logo: !!this.logoLayer,
    });
  }

  /**
   * Добавляет слой в renderer.
   */
  addLayer(layer: BaseLayer): void {
    this.layers.push(layer);
  }

  /**
   * Получает UI Layer для настройки.
   */
  getUILayer(): UILayer | null {
    return this.uiLayer;
  }

  /**
   * Получает Quality Manager.
   */
  getQualityManager(): QualityManager {
    return this.qualityManager;
  }

  /**
   * Запускает render loop.
   */
  start(): void {
    if (this.isRunning || !this.isReady || !this.app) {
      console.warn('Cannot start render loop:', {
        isRunning: this.isRunning,
        isReady: this.isReady,
        hasApp: !!this.app,
      });
      return;
    }
    
    console.log('Starting render loop');
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Останавливает render loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Подключает timeline engine к renderer.
   */
  connectEngine(engine: TimelineEngine, eventBus: EventBus): void {
    this.engine = engine;
    this.eventBus = eventBus;

    // Сразу получаем текущее состояние
    if (this.engine) {
      this.currentState = this.engine.getCurrentState();
      console.log('Engine connected to renderer, initial state:', {
        elapsed: this.currentState.elapsed,
        phase: this.currentState.phase,
        chartOpacity: this.currentState.chartParams.opacity,
        layersCount: this.layers.length,
      });
    }

    // Подписываемся на обновления состояния (для реактивности)
    eventBus.on('*', () => {
      if (this.engine) {
        this.currentState = this.engine.getCurrentState();
      }
    });
  }

  /**
   * Обновляет состояние timeline и перерисовывает.
   */
  updateState(state: TimelineState): void {
    this.currentState = state;
  }

  /**
   * Основной цикл рендеринга.
   */
  private tick = (): void => {
    if (!this.isRunning || !this.isReady || !this.app) return;

    // Проверяем, что stage существует (не уничтожен)
    if (!this.app.stage) {
      this.stop();
      return;
    }

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Обновляем состояние от engine в каждом кадре
    // Это гарантирует, что состояние всегда актуально
    if (this.engine) {
      // Всегда обновляем состояние в каждом кадре для плавной анимации
      this.currentState = this.engine.getCurrentState();
    } else if (!this.currentState) {
      // Создаем минимальное начальное состояние для отрисовки
      // Это позволит видеть хотя бы фон, пока engine не подключен
      this.currentState = {
        elapsed: 0,
        phase: 'SIGNAL' as Phase,
        macroPhase: 'SIGNAL' as MacroPhase,
        intensity: 0,
        chartRole: 'signal' as ChartRole,
        chartParams: { opacity: 0.08, blur: 6, scale: 0.96 },
        uiOpacity: 1,
        uiScale: 1,
        uiBlur: 0,
        uiBreathing: 0,
        isInterrupt: false,
        narrativeText: null,
        dynamicHeader: null,
        beamEvent: null,
        visibleTasksCount: 0,
        taskImpactIndex: null,
        taskProgress: 0,
        brandProgress: 0,
        implosionProgress: 0,
        implosionScale: 1,
        implosionOpacity: 1,
      };
    }

    if (this.currentState) {
      // Сначала обновляем слои, которые предоставляют данные
      this.layers.forEach((layer, index) => {
        try {
          layer.update(dt, this.currentState!);
        } catch (e) {
          console.warn(`Error updating layer ${index}:`, e);
        }
      });

      // Логируем состояние раз в секунду для отладки
      if (Math.floor(this.currentState.elapsed / 1000) !== Math.floor((this.currentState.elapsed - dt) / 1000)) {
        console.log('Render state:', {
          elapsed: Math.floor(this.currentState.elapsed),
          phase: this.currentState.phase,
          chartOpacity: this.currentState.chartParams.opacity.toFixed(2),
          layersUpdated: this.layers.length,
        });
      }

    }

    // Явно рендерим кадр (PixiJS v8 может требовать явного render)
    if (this.app && this.app.renderer) {
      this.app.renderer.render(this.app.stage);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Обрабатывает изменение размера окна.
   */
  private handleResize(): void {
    if (!this.app || !this.mounted || !this.app.renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.viewport.resize(width, height);
    this.app.renderer.resize(width, height);
  }

  /**
   * Получает canvas элемент для записи.
   * @throws Error если renderer не инициализирован
   */
  getCanvas(): HTMLCanvasElement {
    if (!this.isReady || !this.app?.canvas) {
      throw new Error('Renderer not initialized');
    }
    return this.app.canvas;
  }

  /**
   * Проверяет, инициализирован ли renderer и готов ли к использованию.
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Проверяет, инициализирован ли renderer (deprecated, используйте getIsReady).
   */
  isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Очищает все ресурсы.
   * Идемпотентный: безопасен при двойном вызове и частично созданном состоянии.
   */
  destroy(): void {
    // Останавливаем render loop
    this.stop();
    
    // Удаляем обработчик resize
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Уничтожаем слои
    this.layers.forEach(layer => {
      try {
        layer.destroy();
      } catch (e) {
        console.warn('Error destroying layer:', e);
      }
    });
    this.layers = [];

    // Очищаем ссылки на слои
    this.backgroundLayer = null;
    this.chartLayer = null;
    this.overlayLayer = null;
    this.logoLayer = null;
    this.uiLayer = null;

    // Уничтожаем Application
    if (this.app) {
      try {
        // Проверяем, что renderer существует перед destroy
        if (this.app.renderer) {
          // Останавливаем ticker если он запущен
          if (this.app.ticker) {
            this.app.ticker.stop();
          }
          this.app.destroy(true, { children: true });
        }
      } catch (e) {
        console.warn('Error destroying Application:', e);
      }
      this.app = undefined;
    }

    this.mounted = false;
    this.isReady = false;
    this.initialized = false;
    this.initPromise = null; // Сбрасываем Promise для возможности повторной инициализации
  }
}

