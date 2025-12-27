/**
 * rendererSingleton - DEPRECATED.
 * 
 * @deprecated Этот модуль удалён в пользу архитектуры вариант C.
 * Используйте PlaybackHost, GalleryHost, ExportHost - каждый создаёт и владеет своим renderer.
 * 
 * Этот файл оставлен только для обратной совместимости с legacy-кодом.
 * Не используйте в новом коде!
 */

import { CanvasRenderer, type RendererConfig } from './CanvasRenderer';

/**
 * @deprecated Используйте новую архитектуру вариант C
 */
export async function getRenderer(config: RendererConfig): Promise<CanvasRenderer> {
  console.error(
    '[DEPRECATED] rendererSingleton.getRenderer() используется в legacy-коде.\n' +
    'Используйте новую архитектуру вариант C: PlaybackHost, GalleryHost, ExportHost.\n' +
    'Каждый Host создаёт и владеет своим renderer.'
  );
  throw new Error(
    'rendererSingleton is deprecated. Use PlaybackHost, GalleryHost, or ExportHost instead.'
  );
}

/**
 * @deprecated Используйте новую архитектуру вариант C
 */
export function getRendererSync(): CanvasRenderer | null {
  console.error(
    '[DEPRECATED] rendererSingleton.getRendererSync() используется в legacy-коде.\n' +
    'Используйте новую архитектуру вариант C: PlaybackHost, GalleryHost, ExportHost.'
  );
  return null;
}

/**
 * @deprecated Используйте новую архитектуру вариант C
 */
export function destroyRenderer(): void {
  console.warn(
    '[DEPRECATED] rendererSingleton.destroyRenderer() больше не требуется.\n' +
    'Каждый Host управляет своим renderer и уничтожает его при размонтировании.'
  );
}

