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
import { Element } from '../elements/Element';
import { DEFAULT_ELEMENTS, ElementConfig } from '../elements/registry';
import { createElements, mountElements } from '../elements/elementFactory';
import { computeLayout, type Layout } from './layout/layout';
import { getContainerContext, setContainerContext, updateContainerLayout } from './containerContext';

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
  // Элементы (новая система)
  private elements: Array<{ element: Element; container: PIXI.Container }> = [];
  private useElements = false; // Флаг использования элементов вместо слоев
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
  private layersInitialized = false; // Флаг инициализации слоев (идемпотентность)
  private resizeHandler?: () => void;
  private cachedLayout: Layout | null = null; // Кэш layout

  constructor(config: RendererConfig) {
    // Используем фиксированный размер 16:9 для viewport (базовое разрешение)
    const width = config.width || 1920;
    const height = config.height || 1080;
    
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
      // Используем фиксированный размер 16:9 для canvas
      const canvasWidth = 1920;
      const canvasHeight = 1080;
      const qualityConfig = this.qualityManager.getConfig();

      try {
        // 1) Создаем Application без опций
        const app = new Application();
        this.app = app;

        // 2) Обязательно await init() с фиксированным размером 16:9
        await app.init({
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: config.backgroundColor ?? 0x0b1120, // #0b1120
          antialias: config.antialias ?? qualityConfig.antialias,
          resolution: config.resolution ?? qualityConfig.resolution,
          autoDensity: true,
        });

        // 3) После init canvas гарантированно есть
        if (!app.canvas) {
          throw new Error('Pixi app.canvas is undefined after init()');
        }

        // 4) Устанавливаем стили для центрирования canvas (16:9 формат)
        const canvas = app.canvas;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.objectFit = 'contain';
        
        // Обновляем размеры canvas для центрирования в контейнере
        this.updateCanvasStyles(canvas, config.container);

        // 5) Устанавливаем флаг инициализации ПЕРЕД добавлением в DOM
        this.initialized = true;

        // 6) Добавляем canvas в DOM
        config.container.appendChild(canvas);
        console.log('[CanvasRenderer] CanvasRenderer initialized and mounted to container');

        // 7) Инициализируем слои (теперь это безопасно)
        this.initLayers();

        // 8) Обработка изменения размера
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

  /**
   * Вычисляет и кэширует layout.
   */
  private computeLayout(): Layout {
    if (!this.cachedLayout || 
        this.cachedLayout.width !== this.viewport.getWidth() ||
        this.cachedLayout.height !== this.viewport.getHeight()) {
      this.cachedLayout = computeLayout(this.viewport, 'default', 'fit');
    }
    return this.cachedLayout;
  }

  /**
   * Получает текущий layout (кэшированный).
   */
  getLayout(): Layout {
    return this.computeLayout();
  }

  /**
   * Инициализирует элементы через registry.
   * Используется вместо слоев для модульной архитектуры.
   */
  initElements(elementConfigs?: ElementConfig[]): void {
    if (this.layersInitialized) {
      console.warn('Layers already initialized, skipping elements initialization');
      return;
    }

    if (!this.initialized || !this.app) {
      throw new Error('Cannot init elements: app is not initialized');
    }

    if (!this.app.renderer || !this.app.stage) {
      throw new Error('Cannot init elements: app.renderer or app.stage is not available');
    }

    // Вычисляем layout
    const layout = this.computeLayout();

    // Создаем корневой контейнер для всех элементов
    const rootContainer = new Container();
    this.app.stage.addChild(rootContainer);

    // Используем переданную конфигурацию или дефолтную
    const configs = elementConfigs || DEFAULT_ELEMENTS;
    const elementsWithZIndex = createElements(configs);

    // Монтируем элементы с layout в контексте
    const elementContainers = mountElements(elementsWithZIndex, rootContainer, this.viewport, layout);

    // Сохраняем элементы и их контейнеры
    this.elements = elementsWithZIndex.map(({ element }) => ({
      element,
      container: elementContainers.get(element)!,
    }));

    this.useElements = true;
    this.layersInitialized = true;

    console.log('Elements initialized:', {
      total: this.elements.length,
      configs: configs.map(c => c.type),
      layout: {
        width: layout.width,
        height: layout.height,
        safe: layout.safe,
      },
    });
  }

  private initLayers(): void {
    // Идемпотентность: если слои уже инициализированы, ничего не делаем
    if (this.layersInitialized) {
      return;
    }

    // Проверка: initLayers() может вызываться только после await app.init()
    if (!this.initialized || !this.app) {
      throw new Error('Cannot init layers: app is not initialized. Call initLayers() only after await app.init() completes.');
    }

    // Дополнительная проверка на наличие renderer и stage
    if (!this.app.renderer || !this.app.stage) {
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

    this.layersInitialized = true;

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
      if (this.useElements) {
        // Обновляем layout при изменении viewport
        const layout = this.computeLayout();
        
        // Обновляем элементы (новая система) с актуальным layout
        this.elements.forEach(({ element, container }, index) => {
          try {
            // Обновляем layout в контексте элемента
            const existingContext = getContainerContext(container);
            if (!existingContext) {
              setContainerContext(container, {
                container,
                viewport: this.viewport,
                layout,
              });
            } else {
              updateContainerLayout(container, layout);
            }
            
            element.update(dt, this.currentState!);
          } catch (e) {
            console.warn(`Error updating element ${index}:`, e);
          }
        });
      } else {
        // Обновляем слои (старая система)
        this.layers.forEach((layer, index) => {
          try {
            layer.update(dt, this.currentState!);
          } catch (e) {
            console.warn(`Error updating layer ${index}:`, e);
          }
        });
      }

      // Логируем состояние раз в секунду для отладки
      if (Math.floor(this.currentState.elapsed / 1000) !== Math.floor((this.currentState.elapsed - dt) / 1000)) {
        console.log('Render state:', {
          elapsed: Math.floor(this.currentState.elapsed),
          phase: this.currentState.phase,
          chartOpacity: this.currentState.chartParams.opacity.toFixed(2),
          useElements: this.useElements,
          itemsUpdated: this.useElements ? this.elements.length : this.layers.length,
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
   * Обновляет стили canvas для центрирования в контейнере (16:9 формат).
   * Контейнер использует flexbox (items-center justify-center), поэтому используем margin: auto.
   */
  private updateCanvasStyles(canvas: HTMLCanvasElement, container: HTMLElement): void {
    const targetAspectRatio = 16 / 9;
    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    // Сбрасываем предыдущие стили
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.margin = '';
    
    if (containerAspectRatio > targetAspectRatio) {
      // Контейнер шире, чем 16:9 - центрируем по вертикали (canvas занимает всю высоту)
      const canvasHeight = containerHeight;
      const canvasWidth = canvasHeight * targetAspectRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.margin = '0 auto';
    } else {
      // Контейнер уже или равен 16:9 - центрируем по горизонтали (canvas занимает всю ширину)
      const canvasWidth = containerWidth;
      const canvasHeight = canvasWidth / targetAspectRatio;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.margin = '0 auto';
    }
  }

  /**
   * Обрабатывает изменение размера окна.
   */
  private handleResize(): void {
    if (!this.app || !this.mounted || !this.app.renderer || !this.app.canvas) return;

    const container = this.app.canvas.parentElement;
    if (!container) return;

    // Viewport использует фиксированный размер 1920x1080 (16:9)
    // Canvas масштабируется через CSS для центрирования
    const viewportWidth = 1920;
    const viewportHeight = 1080;
    
    this.viewport.resize(viewportWidth, viewportHeight);
    this.app.renderer.resize(viewportWidth, viewportHeight);
    
    // Обновляем стили canvas для центрирования
    this.updateCanvasStyles(this.app.canvas, container);
    
    // Сбрасываем кэш layout для пересчёта
    this.cachedLayout = null;
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
   * Получает список элементов для inspector.
   */
  getElements(): Array<{ element: Element; container: PIXI.Container; type: string }> {
    if (!this.useElements) {
      return [];
    }
    // Определяем тип элемента по его классу
    return this.elements.map(({ element, container }) => {
      const type = element.constructor.name.replace('Element', '').toLowerCase();
      return { element, container, type };
    });
  }

  /**
   * Устанавливает видимость элемента по индексу.
   */
  setElementVisible(index: number, visible: boolean): void {
    if (!this.useElements || index < 0 || index >= this.elements.length) {
      return;
    }
    const { container } = this.elements[index];
    container.visible = visible;
  }

  /**
   * Получает видимость элемента по индексу.
   */
  getElementVisible(index: number): boolean {
    if (!this.useElements || index < 0 || index >= this.elements.length) {
      return false;
    }
    return this.elements[index].container.visible;
  }

  /**
   * Получает bounding box элемента по индексу.
   */
  getElementBounds(index: number): { x: number; y: number; width: number; height: number } | null {
    if (!this.useElements || index < 0 || index >= this.elements.length) {
      return null;
    }
    const { container } = this.elements[index];
    const bounds = container.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  /**
   * Получает viewport для inspector.
   */
  getViewport(): Viewport {
    return this.viewport;
  }

  /**
   * Получает PixiJS Application для inspector (для отрисовки debug overlay).
   */
  getApplication(): Application | undefined {
    return this.app;
  }

  /**
   * Очищает все ресурсы.
   * Идемпотентный: безопасен при двойном вызове и частично созданном состоянии.
   * 
   * ВНИМАНИЕ: В dev режиме destroy пропускается для защиты от StrictMode.
   */
  destroy(): void {
    console.log('[CanvasRenderer] Destroy called');
    
    // Останавливаем render loop
    this.stop();
    
    // Удаляем обработчик resize
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Уничтожаем элементы или слои
    if (this.useElements) {
      this.elements.forEach(({ element }) => {
        try {
          element.dispose(); // Освобождаем ресурсы перед уничтожением
          element.destroy();
        } catch (e) {
          console.warn('Error destroying element:', e);
        }
      });
      this.elements = [];
    } else {
      this.layers.forEach(layer => {
        try {
          layer.destroy();
        } catch (e) {
          console.warn('Error destroying layer:', e);
        }
      });
      this.layers = [];
    }

    // Очищаем ссылки на слои
    this.backgroundLayer = null;
    this.chartLayer = null;
    this.overlayLayer = null;
    this.logoLayer = null;
    this.uiLayer = null;
    this.useElements = false;

    // Удаляем canvas из DOM перед уничтожением Application
    if (this.app?.canvas) {
      const canvas = this.app.canvas;
      const parent = canvas.parentElement;
      if (parent) {
        try {
          parent.removeChild(canvas);
          console.log('[CanvasRenderer] Canvas removed from DOM');
        } catch (e) {
          console.warn('[CanvasRenderer] Error removing canvas from DOM:', e);
        }
      }
    }

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
    this.layersInitialized = false;
    this.initPromise = null; // Сбрасываем Promise для возможности повторной инициализации
  }
}

