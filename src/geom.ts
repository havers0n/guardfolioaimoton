export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Normalizes a point relative to a container rectangle.
 * Returns coordinates in [0, 1] range.
 */
export function normalizePoint(point: Point, containerRect: Rect): Point {
  return {
    x: (point.x - containerRect.left) / containerRect.width,
    y: (point.y - containerRect.top) / containerRect.height,
  };
}

/**
 * Denormalizes a point from [0, 1] range to pixel coordinates within a container.
 */
export function denormalizePoint(normalizedPoint: Point, containerRect: Rect): Point {
  return {
    x: containerRect.left + normalizedPoint.x * containerRect.width,
    y: containerRect.top + normalizedPoint.y * containerRect.height,
  };
}

/**
 * Gets the center point of a DOM element's bounding rect.
 */
export function getElementCenter(rect: DOMRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

