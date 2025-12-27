/**
 * ElementFactory - логика создания и монтирования элементов.
 * Вынесено из registry.ts для разделения данных и логики.
 */

import { Element, ElementContext } from './Element';
import { BackgroundElement } from './BackgroundElement';
import { ChartElement } from './ChartElement';
import { OverlayTextElement } from './OverlayTextElement';
import { LogoElement } from './LogoElement';
import * as PIXI from 'pixi.js';
import type { Layout } from '../renderer/layout/layout';
import type { ElementConfig } from './registry';

/**
 * Создает экземпляр элемента по конфигурации.
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
  viewport: { getWidth(): number; getHeight(): number },
  layout: Layout
): Map<Element, PIXI.Container> {
  const elementContainers = new Map<Element, PIXI.Container>();

  elements.forEach(({ element, zIndex }) => {
    // Создаем отдельный контейнер для каждого элемента
    const container = new PIXI.Container();
    container.zIndex = zIndex; // Для упорядочивания
    rootContainer.addChild(container);

    // Монтируем элемент с layout в контексте
    const context: ElementContext = {
      container,
      viewport,
      layout,
    };
    element.mount(context);

    elementContainers.set(element, container);
  });

  // Сортируем контейнеры по z-index
  rootContainer.children.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return elementContainers;
}

