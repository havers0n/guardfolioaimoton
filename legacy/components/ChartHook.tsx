import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChartRoleParams } from '../src/timeline';
import { Point, normalizePoint, getElementCenter } from '../src/geom';

interface ChartHookProps {
  elapsed: number;
  roleParams: ChartRoleParams;
  containerRect: DOMRect | null;
  onRiskPoints: (points: Point[]) => void;
}

const ChartHook: React.FC<ChartHookProps> = ({ 
  elapsed, 
  roleParams, 
  containerRect,
  onRiskPoints 
}) => {
  const [chartPoints, setChartPoints] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const riskPointRefs = useRef<(SVGCircleElement | null)[]>([]);

  // Инициализация точек графика
  useEffect(() => {
    const initialPoints = Array.from({ length: 15 }, (_, i) => {
      const base = 50 + Math.sin(i * 0.5) * 20;
      return base;
    });
    setChartPoints(initialPoints);
  }, []);

  // Анимация графика
  useEffect(() => {
    const updateChart = () => {
      timeRef.current += 0.05;
      setChartPoints((prev) => {
        return prev.map((point, i) => {
          const base = 50 + Math.sin(i * 0.5 + timeRef.current) * 20;
          const noise = Math.sin(timeRef.current * 2 + i) * 5;
          return base + noise;
        });
      });
      animationFrameRef.current = requestAnimationFrame(updateChart);
    };

    animationFrameRef.current = requestAnimationFrame(updateChart);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate and report risk points
  useLayoutEffect(() => {
    if (!containerRect || !svgRef.current) return;

    // Report risk points
    const points: Point[] = [];
    riskPointRefs.current.forEach((el) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = getElementCenter(rect);
        points.push(normalizePoint(center, containerRect));
      }
    });

    if (points.length > 0) {
      onRiskPoints(points);
    }
  }, [chartPoints, containerRect, onRiskPoints, roleParams]);

  // Генерация SVG path для графика
  const generatePath = (points: number[], width: number, height: number) => {
    if (points.length === 0) return "";
    const stepX = width / (points.length - 1);
    let path = `M 0 ${height - points[0]}`;
    
    points.forEach((point, i) => {
      const x = i * stepX;
      const y = height - point;
      path += ` L ${x} ${y}`;
    });
    
    return path;
  };

  const chartWidth = 600;
  const chartHeight = 200;

  // Risk points emergence: RISK_EMERGENCE (4s - 7s)
  const getRiskPointOpacity = (elapsed: number) => {
    if (elapsed < 4_000) return 0;
    if (elapsed > 7_000) return 1;
    return (elapsed - 4_000) / (7_000 - 4_000);
  };
  const riskOpacity = getRiskPointOpacity(elapsed);

  // Deterministic risk indices
  const riskIndices = [3, 6, 9, 12]; 

  return (
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl flex items-center justify-center"
      style={{
        opacity: roleParams.opacity,
        filter: `blur(${roleParams.blur}px)`,
        transform: `translate(-50%, -50%) scale(${roleParams.scale})`,
        transition: 'opacity 0.1s linear, filter 0.1s linear, transform 0.1s linear',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <div className="relative">
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Fill */}
          <path
            d={`${generatePath(chartPoints, chartWidth, chartHeight)} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#chartGradient)"
            opacity={0.4}
          />
          
          {/* Grid */}
          <g opacity={0.3}>
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i + 1) * (chartHeight / 6);
              return (
                <line
                  key={`grid-h-${i}`}
                  x1={0} y1={y} x2={chartWidth} y2={y}
                  stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.15"
                />
              );
            })}
          </g>

          {/* Line */}
          <path
            d={generatePath(chartPoints, chartWidth, chartHeight)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity={0.8}
            filter="url(#glow)"
          />
          
          {/* Risk Points */}
          {riskIndices.map((idx, mapIdx) => {
            if (idx >= chartPoints.length) return null;
            const point = chartPoints[idx];
            const x = (idx / (chartPoints.length - 1)) * chartWidth;
            const y = chartHeight - point;
            
            // Standard pulse (SIGNAL_TO_PATTERN)
            const pulsePhase = ((elapsed / 1000) * 2 + idx * 0.5) % (Math.PI * 2);
            const pulseScale = 1 + Math.sin(pulsePhase) * 0.3;

            // Effective opacity: red points emerge during RISK_EMERGENCE (4-7s)
            const effectiveOpacity = riskOpacity;

            return (
              <g key={`risk-${idx}`} opacity={effectiveOpacity}>
                 {/* Visible circle */}
                <circle
                  cx={x} cy={y} r={4 * pulseScale}
                  fill="#ef4444"
                />
                {/* Invisible ref target */}
                <circle 
                  ref={el => { riskPointRefs.current[mapIdx] = el }}
                  cx={x} cy={y} r={1} fill="transparent" 
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ChartHook;
