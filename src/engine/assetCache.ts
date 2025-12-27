/**
 * AssetCache - singleton кэш для ассетов (текстуры, шрифты).
 * 
 * Единственное, что можно шарить между режимами (playback/gallery/export).
 * Предотвращает повторную загрузку ресурсов при переключении режимов.
 */

import { AssetLoader, type AssetManifest } from './assetLoader';

let instance: AssetLoader | null = null;

/**
 * Получает singleton AssetLoader.
 * Создаёт новый экземпляр при первом вызове.
 */
export function getAssetCache(): AssetLoader {
  if (!instance) {
    instance = new AssetLoader();
  }
  return instance;
}

/**
 * Очищает кэш ассетов (только при необходимости).
 * Обычно не требуется, так как кэш живёт на протяжении всего жизненного цикла приложения.
 */
export function clearAssetCache(): void {
  if (instance) {
    instance.clear();
  }
}

