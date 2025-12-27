/**
 * ChartLayer - слой графика с анимированными точками и risk points.
 * Миграция из ChartHook компонента.
 */

import { BaseLayer } from './BaseLayer';
import { TimelineState } from '../../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { RNG } from '../../engine/rng';

export class ChartLayer extends BaseLayer {
  private chartGraphics: PIXI.Graphics | null = null;
  private riskPoints: PIXI.Graphics[] = [];
  private chartPoints: number[] = [];
  private timeRef = 0;
  private rng: RNG;
  private riskIndices = [3, 6, 9, 12];
  private riskPointPositions: Array<{ x: number; y: number }> = [];

  constructor(container: PIXI.Container, viewport: { getWidth(): number; getHeight(): number }) {
    super(container, viewport);
    this.rng = new RNG(12345);
    this.init();
  }

  private init(): void {
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
    if (!this.chartGraphics) return;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();
    const chartWidth = 600;
    const chartHeight = 200;
    const centerX = width / 2;
    const centerY = height / 2;

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

    // Рисуем градиентный фон (fill)
    this.chartGraphics.beginFill(0x3b82f6, 0.3 * opacity);
    const path = this.generatePath(this.chartPoints, chartWidth, chartHeight);
    this.chartGraphics.drawPolygon([
      ...path,
      { x: chartWidth, y: chartHeight },
      { x: 0, y: chartHeight },
    ]);
    this.chartGraphics.endFill();

    // Рисуем сетку
    this.chartGraphics.lineStyle(0.5, 0x3b82f6, 0.15 * opacity);
    for (let i = 1; i <= 5; i++) {
      const y = (i * chartHeight) / 6;
      this.chartGraphics.moveTo(0, y);
      this.chartGraphics.lineTo(chartWidth, y);
    }

    // Рисуем линию графика
    this.chartGraphics.lineStyle(2, 0x3b82f6, 0.8 * opacity);
    const linePath = this.generatePath(this.chartPoints, chartWidth, chartHeight);
    this.chartGraphics.drawPolygon(linePath);

    // Применяем blur через фильтр
    if (blur > 0) {
      this.chartGraphics.filters = [new PIXI.BlurFilter(blur)];
    } else {
      this.chartGraphics.filters = [];
    }

    // Позиционируем график
    this.chartGraphics.x = centerX - chartWidth / 2;
    this.chartGraphics.y = centerY - chartHeight / 2;
    this.chartGraphics.alpha = opacity;

    // Обновляем risk points
    this.updateRiskPoints(state, chartWidth, chartHeight, centerX, centerY);
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
    centerX: number,
    centerY: number
  ): void {
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
      riskPoint.beginFill(0xef4444, riskOpacity);
      riskPoint.drawCircle(0, 0, 4 * pulseScale);
      riskPoint.endFill();

      riskPoint.x = centerX - chartWidth / 2 + x;
      riskPoint.y = centerY - chartHeight / 2 + y;
      riskPoint.alpha = riskOpacity;

      // Сохраняем нормализованную позицию
      const normalizedX = (centerX - chartWidth / 2 + x) / this.viewport.getWidth();
      const normalizedY = (centerY - chartHeight / 2 + y) / this.viewport.getHeight();
      this.riskPointPositions[mapIdx] = { x: normalizedX, y: normalizedY };
    });
  }

  /**
   * Получает нормализованные позиции risk points.
   */
  getRiskPointPositions(): Array<{ x: number; y: number }> {
    return this.riskPointPositions;
  }

  destroy(): void {
    if (this.chartGraphics) {
      this.chartGraphics.destroy({ children: true });
      this.chartGraphics = null;
    }
    this.riskPoints.forEach(point => {
      point.destroy({ children: true });
    });
    this.riskPoints = [];
  }
}

