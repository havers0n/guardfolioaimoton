/**
 * rendererSingleton - управление жизненным циклом CanvasRenderer вне React.
 * Решает проблему StrictMode: renderer не пересоздаётся при re-render.
 */

import { CanvasRenderer, RendererConfig } from './CanvasRenderer';

let renderer: CanvasRenderer | null = null;
let initPromise: Promise<CanvasRenderer> | null = null;

/**
 * Получает или создаёт singleton renderer.
 * Идемпотентный: повторные вызовы возвращают тот же экземпляр.
 */
export async function getRenderer(config: RendererConfig): Promise<CanvasRenderer> {
  // Если уже инициализирован, возвращаем сразу
  if (renderer && renderer.getIsReady()) {
    return renderer;
  }

  // Если идёт инициализация, ждём её завершения
  if (initPromise) {
    return initPromise;
  }

  // Создаём новый renderer и инициализируем
  initPromise = (async () => {
    if (renderer) {
      // Если renderer существует, но не готов, ждём его готовности
      // (может быть в процессе инициализации)
      while (!renderer.getIsReady()) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return renderer;
    }

    // Создаём новый renderer
    renderer = new CanvasRenderer(config);
    await renderer.init(config);
    renderer.start();

    return renderer;
  })();

  return initPromise;
}

/**
 * Получает текущий renderer без создания нового.
 * Возвращает null, если renderer не инициализирован.
 */
export function getRendererSync(): CanvasRenderer | null {
  return renderer;
}

/**
 * Уничтожает renderer (только при закрытии приложения).
 * В dev режиме не уничтожает (для стабилизации разработки).
 */
export function destroyRenderer(): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[rendererSingleton] Destroy skipped in dev mode (StrictMode protection)');
    return;
  }

  if (renderer) {
    renderer.destroy();
    renderer = null;
    initPromise = null;
  }
}

