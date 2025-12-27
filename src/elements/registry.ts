/**
 * ElementRegistry - система сборки сцены из набора элементов.
 * Позволяет регистрировать и управлять элементами сцены.
 */

import { Element, ElementContext } from './Element';
import { BackgroundElement } from './BackgroundElement';
import { ChartElement } from './ChartElement';
import { OverlayTextElement } from './OverlayTextElement';
import { LogoElement } from './LogoElement';
import * as PIXI from 'pixi.js';

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
 * Регистрация элементов - создает экземпляры элементов по конфигурации.
 */
export function createElement(config: ElementConfig): Element {
  switch (config.type) {
    case 'background':
      return new BackgroundElement();
    case 'chart':
      return new ChartElement();
    case 'overlay-text':
      return new OverlayTextElement();
    case 'logo':
      return new LogoElement();
    default:
      throw new Error(`Unknown element type: ${(config as any).type}`);
  }
}

/**
 * Создает набор элементов по конфигурации.
 */
export function createElements(configs: ElementConfig[]): Array<{ element: Element; zIndex: number }> {
  return configs
    .map(config => ({
      element: createElement(config),
      zIndex: config.zIndex ?? 0,
    }))
    .sort((a, b) => a.zIndex - b.zIndex); // Сортируем по z-index
}

/**
 * Монтирует элементы в контейнеры с учетом z-index.
 * Создает отдельные контейнеры для каждого элемента для правильного упорядочивания.
 */
export function mountElements(
  elements: Array<{ element: Element; zIndex: number }>,
  rootContainer: PIXI.Container,
  viewport: { getWidth(): number; getHeight(): number }
): Map<Element, PIXI.Container> {
  const elementContainers = new Map<Element, PIXI.Container>();

  elements.forEach(({ element, zIndex }) => {
    // Создаем отдельный контейнер для каждого элемента
    const container = new PIXI.Container();
    container.zIndex = zIndex; // Для упорядочивания
    rootContainer.addChild(container);

    // Монтируем элемент
    const context: ElementContext = {
      container,
      viewport,
    };
    element.mount(context);

    elementContainers.set(element, container);
  });

  // Сортируем контейнеры по z-index
  rootContainer.children.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return elementContainers;
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

