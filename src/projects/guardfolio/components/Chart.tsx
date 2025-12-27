/**
 * Chart - React-компонент для графика с анимированными точками.
 * Упрощенная версия для витрины Storybook.
 */

import React, { useMemo } from 'react';
import type { TimelineState } from '../../../engine/timelineSpec';

export interface ChartProps {
  state: TimelineState;
  width?: number;
  height?: number;
}

export const Chart: React.FC<ChartProps> = ({ state, width = 1920, height = 1080 }) => {
  const scale = Math.min(width / 1920, height / 1080);
  const grid = 16 * (width / 1920);
  const contentWidth = width - Math.max(48, width * 0.06) * 2;
  const chartWidth = contentWidth * 0.45;
  const chartHeight = chartWidth * 0.4;
  const leftColX = Math.max(48, width * 0.06);
  const safeTop = Math.max(64, height * 0.08);
  const chartX = leftColX;
  const chartY = safeTop + grid * 3;

  // Генерируем точки графика (упрощенно, без анимации)
  const points = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const base = 50 + Math.sin(i * 0.5) * 20;
      return base;
    });
  }, []);

  // Risk points indices
  const riskIndices = [3, 6, 9, 12];
  
  // Risk points emergence: RISK_EMERGENCE (4s - 7s)
  const riskOpacity = state.elapsed < 4_000 
    ? 0 
    : state.elapsed > 7_000 
    ? 1 
    : (state.elapsed - 4_000) / (7_000 - 4_000);

  // Применяем transform из chartParams
  const chartScale = state.chartParams.scale;
  const chartOpacity = state.chartParams.opacity;
  const chartBlur = state.chartParams.blur;

  // Генерируем path для графика
  const pathPoints = points.map((point, i) => {
    const stepX = chartWidth / (points.length - 1);
    return {
      x: i * stepX,
      y: chartHeight - point,
    };
  });

  const pathData = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div
      style={{
        position: 'absolute',
        left: chartX,
        top: chartY,
        width: chartWidth,
        height: chartHeight,
        transform: `scale(${chartScale})`,
        transformOrigin: 'top left',
        opacity: chartOpacity,
        filter: chartBlur > 0 ? `blur(${chartBlur}px)` : 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Градиентный фон */}
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
        
        {/* Фон (полигон) */}
        <polygon
          points={`${pathPoints.map(p => `${p.x},${p.y}`).join(' ')} ${chartWidth},${chartHeight} 0,${chartHeight}`}
          fill="url(#chartGradient)"
        />

        {/* Сетка */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = ((i + 1) * chartHeight) / 6;
          return (
            <line
              key={i}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="rgba(59, 130, 246, 0.15)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Линия графика */}
        <path
          d={pathData}
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth={2}
        />
      </svg>

      {/* Risk points */}
      {riskIndices.map((idx, mapIdx) => {
        if (idx >= points.length) return null;
        
        const point = points[idx];
        const stepX = chartWidth / (points.length - 1);
        const x = idx * stepX;
        const y = chartHeight - point;

        // Pulse animation
        const pulsePhase = ((state.elapsed / 1000) * 2 + idx * 0.5) % (Math.PI * 2);
        const pulseScale = 1 + Math.sin(pulsePhase) * 0.3;

        return (
          <div
            key={mapIdx}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              width: `${4 * pulseScale}px`,
              height: `${4 * pulseScale}px`,
              borderRadius: '50%',
              backgroundColor: '#ef4444', // red-500
              opacity: riskOpacity,
              transition: 'opacity 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
};

