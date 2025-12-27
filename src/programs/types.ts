/**
 * Program Types - базовые типы для программ (VideoProgram, GalleryProgram, ExportProgram).
 * 
 * Программа - это "плейлист конфигураций", который выбирает активную сцену по времени.
 */

import type { ElementConfig } from '../elements/registry';
import type { CompiledSpec } from '../engine/spec';

/**
 * SceneDef - чистое определение сцены (данные, не объект).
 * 
 * Сцена = конфигурация, не рендерер.
 * Сцена не создаёт Pixi, не держит canvas, не управляет DOM.
 */
export interface SceneDef {
  /** Уникальный идентификатор сцены */
  id: string;
  /** Длительность сцены в миллисекундах */
  durationMs: number;
  /** Спецификация timeline для этой сцены */
  spec: CompiledSpec;
  /** Конфигурация элементов для этой сцены */
  elements: ElementConfig[];
  /** Опциональные флаги входа/выхода (для transitions) */
  enter?: {
    /** Флаг входа (например, fade-in) */
    fadeIn?: boolean;
    /** Длительность входа в миллисекундах */
    duration?: number;
  };
  exit?: {
    /** Флаг выхода (например, fade-out) */
    fadeOut?: boolean;
    /** Длительность выхода в миллисекундах */
    duration?: number;
  };
}

/**
 * SceneState - состояние сцены в конкретный момент времени.
 */
export interface SceneState {
  /** ID активной сцены */
  sceneId: string;
  /** Время относительно начала сцены (0..durationMs) */
  sceneTime: number;
  /** Время относительно начала программы (абсолютное) */
  programTime: number;
  /** Состояние timeline для этой сцены */
  timelineState: any; // TimelineState из timelineSpec
}

/**
 * Program - интерфейс программы (VideoProgram, GalleryProgram, ExportProgram).
 * 
 * Программа выбирает активную сцену по времени и предоставляет:
 * - getSceneAt(t) - получить сцену для времени t
 * - getElementsForScene(id) - получить элементы для сцены
 * - getSpec() - получить общую спецификацию
 */
export interface Program {
  /**
   * Получает активную сцену для указанного времени.
   * @param timeMs Время в миллисекундах относительно начала программы
   * @returns SceneState или null, если нет активной сцены
   */
  getSceneAt(timeMs: number): SceneState | null;

  /**
   * Получает конфигурацию элементов для указанной сцены.
   * @param sceneId ID сцены
   * @returns Массив конфигураций элементов
   */
  getElementsForScene(sceneId: string): ElementConfig[];

  /**
   * Получает общую спецификацию программы.
   * @returns CompiledSpec или null
   */
  getSpec(): CompiledSpec | null;

  /**
   * Получает общую длительность программы в миллисекундах.
   */
  getDuration(): number;

  /**
   * Получает все определения сцен программы.
   */
  getScenes(): SceneDef[];
}

/**
 * TransitionType - тип перехода между сценами.
 */
export type TransitionType = 'cut' | 'fade' | 'shared-elements';

/**
 * Transition - определение перехода между сценами.
 */
export interface Transition {
  /** ID сцены, из которой происходит переход */
  fromSceneId: string;
  /** ID сцены, в которую происходит переход */
  toSceneId: string;
  /** Тип перехода */
  type: TransitionType;
  /** Длительность перехода в миллисекундах (для fade) */
  duration?: number;
}

