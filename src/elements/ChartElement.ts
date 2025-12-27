/**
 * ChartElement - элемент графика с анимированными точками и risk points.
 * Миграция из ChartLayer.
 */

import { Element, ElementContext } from './Element';
import { TimelineState } from '../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { RNG } from '../engine/rng';
import type { Layout } from '../renderer/layout/layout';
import { getContainerContext } from '../renderer/containerContext';

export class ChartElement implements Element {
  private container: PIXI.Container | null = null;
  private viewport: { getWidth(): number; getHeight(): number } | null = null;
  private layout: Layout | null = null;
  private chartGraphics: PIXI.Graphics | null = null;
  private riskPoints: PIXI.Graphics[] = [];
  private chartPoints: number[] = [];
  private timeRef = 0;
  private rng: RNG;
  private riskIndices = [3, 6, 9, 12];
  private riskPointPositions: Array<{ x: number; y: number }> = [];

  constructor() {
    this.rng = new RNG(12345);
  }

  mount(context: ElementContext): void {
    this.container = context.container;
    this.viewport = context.viewport;
    this.layout = context.layout;

    // Инициализируем точки графика
    this.chartPoints = Array.from({ length: 15 }, (_, i) => {
      const base = 50 + Math.sin(i * 0.5) * 20;
      return base;
    });

    // Создаем graphics для графика
    this.chartGraphics = new PIXI.Graphics();
    this.container.addChild(this.chartGraphics);

    // Создаем graphics для risk points
    for (let i = 0; i < this.riskIndices.length; i++) {
      const riskPoint = new PIXI.Graphics();
      this.container.addChild(riskPoint);
      this.riskPoints.push(riskPoint);
    }
  }

  update(dt: number, state: TimelineState): void {
    if (!this.viewport || !this.chartGraphics || !this.container) return;

    // Обновляем layout из контекста контейнера
    const context = getContainerContext(this.container);
    if (context?.layout) {
      this.layout = context.layout;
    }
    
    if (!this.layout) return;

    // Размеры графика через layout токены
    // Ширина = 45% от контентной ширины (для левой колонки)
    const chartWidth = this.layout.contentWidth * 0.45;
    const chartHeight = chartWidth * 0.4; // Сохраняем пропорции
    
    // Позиционирование: левая колонка, отступ от safe.top
    const chartX = this.layout.leftColX;
    const chartY = this.layout.safe.top + this.layout.grid * 3;

    // Обновляем анимацию графика
    this.timeRef += dt * 0.05;
    this.chartPoints = this.chartPoints.map((point, i) => {
      const base = 50 + Math.sin(i * 0.5 + this.timeRef) * 20;
      const noise = Math.sin(this.timeRef * 2 + i) * 5;
      return base + noise;
    });

    // Применяем transform из chartParams
    const scale = state.chartParams.scale;
    const opacity = state.chartParams.opacity;
    const blur = state.chartParams.blur;

    // Очищаем график
    this.chartGraphics.clear();

    // Рисуем градиентный фон (fill) - новый API v8
    const path = this.generatePath(this.chartPoints, chartWidth, chartHeight);
    const polygonPath = [
      ...path,
      { x: chartWidth, y: chartHeight },
      { x: 0, y: chartHeight },
    ];
    this.chartGraphics.poly(polygonPath);
    this.chartGraphics.fill({ color: 0x3b82f6, alpha: 0.3 * opacity });

    // Рисуем сетку - новый API v8
    for (let i = 1; i <= 5; i++) {
      const y = (i * chartHeight) / 6;
      this.chartGraphics.moveTo(0, y);
      this.chartGraphics.lineTo(chartWidth, y);
    }
    this.chartGraphics.stroke({ width: 0.5, color: 0x3b82f6, alpha: 0.15 * opacity });

    // Рисуем линию графика - новый API v8
    const linePath = this.generatePath(this.chartPoints, chartWidth, chartHeight);
    this.chartGraphics.poly(linePath);
    this.chartGraphics.stroke({ width: 2, color: 0x3b82f6, alpha: 0.8 * opacity });

    // Применяем blur через фильтр
    if (blur > 0) {
      this.chartGraphics.filters = [new PIXI.BlurFilter({ blur })];
    } else {
      this.chartGraphics.filters = [];
    }

    // Позиционируем график через layout токены
    this.chartGraphics.x = chartX;
    this.chartGraphics.y = chartY;
    this.chartGraphics.alpha = opacity;

    // Обновляем risk points (передаём позицию графика)
    this.updateRiskPoints(state, chartWidth, chartHeight, chartX, chartY);
  }

  private generatePath(points: number[], width: number, height: number): Array<{ x: number; y: number }> {
    if (points.length === 0) return [];
    const stepX = width / (points.length - 1);
    return points.map((point, i) => ({
      x: i * stepX,
      y: height - point,
    }));
  }

  private updateRiskPoints(
    state: TimelineState,
    chartWidth: number,
    chartHeight: number,
    chartX: number,
    chartY: number
  ): void {
    if (!this.viewport || !this.layout) return;

    // Risk points emergence: RISK_EMERGENCE (4s - 7s)
    const riskOpacity = state.elapsed < 4_000 
      ? 0 
      : state.elapsed > 7_000 
      ? 1 
      : (state.elapsed - 4_000) / (7_000 - 4_000);

    // Инициализируем массив если нужно
    if (this.riskPointPositions.length !== this.riskIndices.length) {
      this.riskPointPositions = new Array(this.riskIndices.length);
    }

    this.riskIndices.forEach((idx, mapIdx) => {
      if (idx >= this.chartPoints.length || !this.riskPoints[mapIdx]) return;

      const point = this.chartPoints[idx];
      const stepX = chartWidth / (this.chartPoints.length - 1);
      const x = idx * stepX;
      const y = chartHeight - point;

      // Pulse animation
      const pulsePhase = ((state.elapsed / 1000) * 2 + idx * 0.5) % (Math.PI * 2);
      const pulseScale = 1 + Math.sin(pulsePhase) * 0.3;

      const riskPoint = this.riskPoints[mapIdx];
      riskPoint.clear();
      riskPoint.circle(0, 0, 4 * pulseScale);
      riskPoint.fill({ color: 0xef4444, alpha: riskOpacity });

      riskPoint.x = chartX + x;
      riskPoint.y = chartY + y;
      riskPoint.alpha = riskOpacity;

      // Сохраняем нормализованную позицию
      const normalizedX = (chartX + x) / this.viewport.getWidth();
      const normalizedY = (chartY + y) / this.viewport.getHeight();
      this.riskPointPositions[mapIdx] = { x: normalizedX, y: normalizedY };
    });
  }

  /**
   * Получает нормализованные позиции risk points.
   */
  getRiskPointPositions(): Array<{ x: number; y: number }> {
    return this.riskPointPositions;
  }

  dispose(): void {
    // Освобождаем ресурсы перед уничтожением
    // Идемпотентный метод - можно вызывать несколько раз
    // Сбрасываем timeRef для детерминизма при повторном использовании
    this.timeRef = 0;
  }

  destroy(): void {
    this.dispose();
    if (this.chartGraphics) {
      this.chartGraphics.destroy({ children: true });
      this.chartGraphics = null;
    }
    this.riskPoints.forEach(point => {
      point.destroy({ children: true });
    });
    this.riskPoints = [];
    this.container = null;
    this.viewport = null;
  }
}

