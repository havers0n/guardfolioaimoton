/**
 * Program / Scene API Spec v1
 * 
 * Единый контракт для запуска сцен в Playback / Gallery / Export режимах.
 * 
 * Инварианты:
 * - Host всегда владеет CanvasRenderer и временем
 * - Program/Scene не создают renderer, не управляют DOM, не знают о React
 * - Все визуальные вычисления детерминированы: результат определяется только t, data, seed, spec
 * - Scene переключается через Pipeline; старые элементы корректно dispose/detach
 */

import type { ElementConfig } from '../elements/registry';
import type { CompiledSpec } from '../engine/spec';
import type { TimelineState } from '../engine/timelineSpec';

/**
 * SceneRef - лёгкая ссылка на сцену.
 * Может содержать идентификатор и временные границы в рамках Program.
 */
export interface SceneRef {
  /** Идентификатор сцены */
  sceneId: string;
  /** Начало сцены в миллисекундах относительно начала программы */
  startMs: number;
  /** Конец сцены в миллисекундах относительно начала программы */
  endMs: number;
  /** Ленивое получение полного объекта Scene */
  getScene(): Scene;
}

/**
 * Scene - описывает один шот: spec таймлайна + набор элементов + правила.
 * 
 * Scene — это данные + правила, без runtime объектов.
 * Никаких new CanvasRenderer(), никаких подписок, никаких таймеров.
 */
export interface Scene {
  /** Идентификатор сцены/шота */
  sceneId: string;
  /** Длительность сцены в миллисекундах */
  durationMs: number;
  /** Версия timeline spec (например "timelineSpec/v1") */
  specVersion: string;
  /** Декларативный таймлайн сцены */
  timelineSpec: CompiledSpec;
  /** Декларативный список элементов */
  elements: ElementConfig[];
  /** Опционально: фиксирует RNG для сцены (если нужно) */
  seed?: number;
  /** Опционально: список ассетов, которые сцена требует (для prefetch) */
  assets?: string[];
  /** Опционально: флаги рендеринга (например noHud, noDebug, safeAreaMode) */
  renderFlags?: {
    noHud?: boolean;
    noDebug?: boolean;
    safeAreaMode?: boolean;
    [key: string]: boolean | undefined;
  };
}

/**
 * ProgramMetadata - метаданные программы.
 */
export interface ProgramMetadata {
  /** Название программы */
  name?: string;
  /** Описание программы */
  description?: string;
  /** Теги для категоризации */
  tags?: string[];
  /** Версия программы */
  version?: string;
  /** Дополнительные метаданные */
  [key: string]: any;
}

/**
 * Program - "контент/сценарий", который возвращает активную сцену/шот на момент времени t.
 * 
 * Требования:
 * - getSceneAt должен быть чистым (pure): без side-effects
 * - Program должен работать одинаково в Playback и Export режимах
 */
export interface Program {
  /** Стабильный идентификатор программы (для логов/кеша) */
  readonly programId: string;
  /** Общая длительность программы (таймлайн верхнего уровня) в миллисекундах */
  readonly durationMs: number;

  /**
   * Возвращает активную сцену (шот) на момент времени tMs в пределах [0..durationMs].
   * 
   * @param tMs Время в миллисекундах относительно начала программы
   * @returns SceneRef для активной сцены или null, если нет активной сцены
   */
  getSceneAt(tMs: number): SceneRef | null;

  /**
   * Опционально: полный список сцен (для UI/инспектора/экспорта по шотам).
   * 
   * @returns Массив всех SceneRef в программе
   */
  getScenes?(): SceneRef[];

  /**
   * Опционально: метаданные программы (название, описание, теги, версия).
   * 
   * @returns Метаданные программы
   */
  getMetadata?(): ProgramMetadata;
}

