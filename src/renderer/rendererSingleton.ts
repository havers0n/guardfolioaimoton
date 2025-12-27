/**
 * rendererSingleton - управление жизненным циклом CanvasRenderer вне React.
 * Renderer живёт своей жизнью, не зависит от React lifecycle.
 */

import { CanvasRenderer, RendererConfig } from './CanvasRenderer';

let instance: CanvasRenderer | null = null;
let initPromise: Promise<CanvasRenderer> | null = null;

/**
 * Получает или создаёт singleton renderer.
 * Идемпотентный: повторные вызовы возвращают тот же экземпляр.
 */
export async function getRenderer(config: RendererConfig): Promise<CanvasRenderer> {
  // Если уже существует, возвращаем
  if (instance) {
    return instance;
  }

  // Если идёт инициализация, ждём
  if (initPromise) {
    return initPromise;
  }

  // Создаём новый renderer
  initPromise = (async () => {
    instance = new CanvasRenderer(config);
    await instance.init(config);
    instance.start();
    return instance;
  })();

  return initPromise;
}

/**
 * Получает текущий renderer без создания нового.
 */
export function getRendererSync(): CanvasRenderer | null {
  return instance;
}

/**
 * Уничтожает renderer (только при закрытии приложения).
 */
export function destroyRenderer(): void {
  if (instance) {
    instance.destroy();
    instance = null;
    initPromise = null;
  }
}

