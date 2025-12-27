/**
 * ElementRegistry - точка правды для конфигураций элементов сцены.
 * 
 * Правило: только данные, никакой логики.
 * Вся логика создания и монтирования элементов вынесена в elementFactory.ts.
 */

/**
 * Конфигурация элемента для регистрации.
 */
export interface ElementConfig {
  /** Тип элемента */
  type: 'background' | 'chart' | 'overlay-text' | 'logo';
  /** Z-index для упорядочивания (больше = выше) */
  zIndex?: number;
  /** Дополнительные параметры элемента (для будущего расширения) */
  params?: Record<string, any>;
}

/**
 * Дефолтная конфигурация элементов для сцены Guardfolio.
 */
export const DEFAULT_ELEMENTS: ElementConfig[] = [
  { type: 'background', zIndex: 0 },
  { type: 'chart', zIndex: 1 },
  { type: 'overlay-text', zIndex: 20 },
  { type: 'logo', zIndex: 30 },
];

