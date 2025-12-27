/**
 * Guardfolio Scene Assets Manifest
 * 
 * Манифест всех ассетов, необходимых для сцены Guardfolio.
 */

import type { AssetManifest } from '../../engine/assetLoader';

/**
 * Манифест ассетов для сцены Guardfolio
 */
export const GUARDFOLIO_ASSETS: AssetManifest = {
  fonts: [
    // Шрифты, используемые в сцене
    // Добавьте сюда все необходимые шрифты
  ],
  textures: [
    // Текстуры, используемые в сцене
    // Добавьте сюда все необходимые текстуры
  ],
};

/**
 * Проверяет, загружены ли все ассеты
 */
export function isAssetsReady(): boolean {
  // Пока ассеты не требуются, возвращаем true
  // В будущем здесь будет проверка загрузки
  return true;
}

