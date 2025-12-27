/**
 * Guardfolio Scene Configuration
 * 
 * Конфигурация для создания сцены Guardfolio.
 * Реальная спецификация timeline загружается из JSON через engine/spec/loader.
 */

import type { TimelineState } from '../../engine/timelineSpec';

/**
 * SceneState - состояние сцены в конкретный момент времени.
 * 
 * Владелец: Scene (модуль сцены)
 * Тип: алиас TimelineState из engine/timelineSpec
 * 
 * Это единственная точка правды для состояния сцены.
 * Все компоненты сцены получают состояние через Scene.getState().
 */
export type SceneState = TimelineState;

/**
 * Тип для режима работы сцены
 */
export type SceneMode = 'playback' | 'recording' | 'preview';

/**
 * Конфигурация создания сцены
 */
export interface CreateSceneConfig {
  container: HTMLElement;
  mode?: SceneMode;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  width?: number;
  height?: number;
}

