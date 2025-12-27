/**
 * Headless Export API (window.__EXPORT__) - спецификация v0.
 * 
 * Протокол управления для экспорта без React и без UI:
 * - batch rendering
 * - CI exports
 * - API: "render video from data"
 */

import type { TimelineState } from '../engine/timelineSpec';

/**
 * Параметры запуска экспорта.
 */
export interface ExportStartParams {
  /** ID программы для экспорта */
  programId?: string;
  /** Качество рендеринга */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** FPS для fixed-step экспорта */
  fps?: number;
  /** Фиксированный seed для детерминизма */
  seed?: number;
}

/**
 * Callback для получения кадра.
 * 
 * @param frameData Данные кадра (canvas blob или imageData)
 * @param frameNumber Номер кадра
 * @param timeMs Время кадра в миллисекундах
 */
export type FrameCallback = (frameData: Blob | ImageData, frameNumber: number, timeMs: number) => void;

/**
 * ExportAPI - интерфейс window.__EXPORT__ API.
 */
export interface ExportAPI {
  /** Готовность к экспорту */
  ready: boolean;
  
  /**
   * Запускает экспорт с указанными параметрами.
   * 
   * @param params Параметры экспорта
   */
  start(params: ExportStartParams): void;
  
  /**
   * Подписывается на кадры экспорта.
   * 
   * @param callback Callback, который вызывается для каждого кадра
   */
  onFrame(callback: FrameCallback): void;
  
  /**
   * Получает следующий кадр (pull-based API).
   * Возвращает null, если экспорт не запущен или завершён.
   * 
   * @returns Данные кадра или null
   */
  pullFrame(): { frameData: Blob | ImageData; frameNumber: number; timeMs: number } | null;
  
  /**
   * Promise завершения экспорта.
   */
  done: Promise<void>;
  
  /**
   * Прерывает экспорт.
   */
  abort(): void;
  
  /**
   * Получает текущее состояние timeline.
   * 
   * @returns Текущее состояние timeline
   */
  getState(): TimelineState;
  
  /**
   * Перемещается на указанное время.
   * 
   * @param ms Время в миллисекундах
   */
  seek(ms: number): void;
}

