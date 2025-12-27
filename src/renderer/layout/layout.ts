/**
 * Layout Contract - единый источник правды для позиционирования элементов.
 * 
 * Предоставляет токены для:
 * - safe-area (зависит от aspect ratio)
 * - сетки/отступов
 * - колонок (левая/центр/правая)
 * - масштабирования под разные aspect ratio
 * - типографических размеров
 */

import { Viewport } from '../viewport';

/**
 * Preset для layout (может быть расширен в будущем)
 */
export type LayoutPreset = 'default';

/**
 * Режим масштабирования
 */
export type LayoutMode = 'fit' | 'fill' | 'cover';

/**
 * Типографические размеры
 */
export interface Typography {
  h1: { fontSize: number; lineHeight: number };
  h2: { fontSize: number; lineHeight: number };
  body: { fontSize: number; lineHeight: number };
  small: { fontSize: number; lineHeight: number };
}

/**
 * Layout - результат вычисления layout контракта
 */
export interface Layout {
  /** Safe area в пикселях */
  safe: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };

  /** Размер сетки (базовый отступ) */
  grid: number;

  /** Центр viewport */
  centerX: number;
  centerY: number;

  /** Левая колонка (X координата) */
  leftColX: number;

  /** Правая колонка (X координата) */
  rightColX: number;

  /** Центральная колонка (X координата) */
  centerColX: number;

  /** Ширина контентной области */
  contentWidth: number;

  /** Высота контентной области */
  contentHeight: number;

  /** Масштаб для fit-to-viewport */
  scale: number;

  /** Типографические размеры */
  typography: Typography;

  /** Ширина viewport */
  width: number;

  /** Высота viewport */
  height: number;

  /** Aspect ratio */
  aspectRatio: number;
}

/**
 * Вычисляет layout на основе viewport и preset.
 * 
 * Safe-area зависит от aspect ratio:
 * - для 9:16 (вертикальный): top/bottom больше
 * - для 16:9 (горизонтальный): меньше
 */
export function computeLayout(
  viewport: Viewport,
  preset: LayoutPreset = 'default',
  mode: LayoutMode = 'fit'
): Layout {
  const width = viewport.getWidth();
  const height = viewport.getHeight();
  const aspectRatio = width / height;

  // Базовый размер сетки (16px на 1920px ширине, масштабируется)
  const baseGrid = 16;
  const grid = baseGrid * (width / 1920);

  // Safe area зависит от aspect ratio
  // Для вертикальных форматов (9:16) нужны большие отступы сверху/снизу
  // Для горизонтальных (16:9) - меньше и симметричные для центрирования
  const isVertical = aspectRatio < 1;
  const isHorizontal = aspectRatio > 1.5;

  // Базовые safe area значения
  // Для вертикальных: больше top/bottom
  // Для горизонтальных: больше left/right
  const safeX = Math.max(48, width * 0.06);
  const safeY = isVertical 
    ? Math.max(80, height * 0.12)  // Больше для вертикальных
    : Math.max(64, height * 0.08);  // Меньше для горизонтальных

  // Для горизонтального формата делаем одинаковые отступы сверху и снизу для центрирования
  // Для 16:9 (1920x1080) это гарантирует, что safe area будет по центру
  let safeTop: number;
  let safeBottom: number;
  
  if (isVertical) {
    // Вертикальный формат - разные отступы
    safeTop = Math.max(96, height * 0.15);
    safeBottom = Math.max(96, height * 0.15);
  } else {
    // Горизонтальный формат (16:9) - одинаковые отступы для центрирования
    // Уменьшаем отступы для поднятия safe area выше (было 0.08, теперь 0.06)
    const horizontalSafeY = Math.max(48, height * 0.06);
    safeTop = horizontalSafeY;
    safeBottom = horizontalSafeY;  // Явно одинаковые значения для центрирования
  }

  // Центр
  const centerX = width / 2;
  const centerY = height / 2;

  // Контентная область (без safe area)
  const contentWidth = width - safeX * 2;
  const contentHeight = height - safeTop - safeBottom;

  // Колонки (3-колоночная сетка)
  const columnGap = grid * 2; // 32px на базовой ширине
  const columnWidth = (contentWidth - columnGap * 2) / 3;
  
  const leftColX = safeX;
  const centerColX = safeX + columnWidth + columnGap;
  const rightColX = safeX + (columnWidth + columnGap) * 2;

  // Масштаб для fit-to-viewport (базовый размер 1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;
  const scaleX = width / baseWidth;
  const scaleY = height / baseHeight;
  const scale = mode === 'fit' 
    ? Math.min(scaleX, scaleY)  // Fit: сохраняет пропорции
    : mode === 'cover'
    ? Math.max(scaleX, scaleY)   // Cover: заполняет весь экран
    : scaleX;                    // Fill: растягивает по X

  // Типографические размеры (масштабируются с viewport)
  const typography: Typography = {
    h1: {
      fontSize: 48 * scale,
      lineHeight: 56 * scale,
    },
    h2: {
      fontSize: 32 * scale,
      lineHeight: 40 * scale,
    },
    body: {
      fontSize: 16 * scale,
      lineHeight: 24 * scale,
    },
    small: {
      fontSize: 12 * scale,
      lineHeight: 18 * scale,
    },
  };

  return {
    safe: {
      left: safeX,
      right: width - safeX,
      top: safeTop,
      bottom: height - safeBottom,
    },
    grid,
    centerX,
    centerY,
    leftColX,
    rightColX,
    centerColX,
    contentWidth,
    contentHeight,
    scale,
    typography,
    width,
    height,
    aspectRatio,
  };
}

