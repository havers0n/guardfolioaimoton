/**
 * ProgressRing - круговой прогресс-индикатор с иконкой внутри и вращающимися линиями вокруг.
 */

import React from 'react';

export interface ProgressRingProps {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  showIcon?: boolean;
  animationSpeed?: number; // Скорость вращения линий (оборотов в секунду)
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  showIcon = true,
  animationSpeed = 1,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  // Цвета: синий сегмент и зеленый сегмент
  const blueEnd = 0.2; // 20% синий
  const greenStart = 0.2; // Остальное зеленый
  const greenProgress = Math.max(0, (progress - blueEnd) / (1 - blueEnd));

  // Параметры для вращающихся линий
  const lineCount = 16; // Количество линий
  const lineAngle = (2 * Math.PI) / lineCount;
  const outerRadius = radius + strokeWidth * 1.5; // Радиус для линий
  const lineLength = strokeWidth * 0.6;
  const containerSize = size + strokeWidth * 4; // Размер контейнера с учетом линий

  return (
    <>
      {/* CSS для анимации вращения */}
      <style>
        {`
          @keyframes progressRingRotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'relative',
          width: containerSize,
          height: containerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Вращающиеся линии вокруг прогресс-бара */}
        <svg
          width={containerSize}
          height={containerSize}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <g
            style={{
              transformOrigin: `${containerSize / 2}px ${containerSize / 2}px`,
              animation: `progressRingRotate ${1 / animationSpeed}s linear infinite`,
            }}
          >
          {Array.from({ length: lineCount }).map((_, i) => {
            const angle = i * lineAngle;
            const centerX = containerSize / 2;
            const centerY = containerSize / 2;
            
            // Чередуем синие и зеленые линии
            const isBlue = i % 2 === 0;
            const lineColor = isBlue ? '#3b82f6' : '#22c55e'; // blue-500 : green-500
            
            const x1 = centerX + outerRadius * Math.cos(angle);
            const y1 = centerY + outerRadius * Math.sin(angle);
            const x2 = centerX + (outerRadius + lineLength) * Math.cos(angle);
            const y2 = centerY + (outerRadius + lineLength) * Math.sin(angle);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={lineColor}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
        </g>
      </svg>

      {/* Прогресс-бар */}
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b" // slate-800
          strokeWidth={strokeWidth}
        />

        {/* Синий сегмент (первые 20%) */}
        {progress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3b82f6" // blue-500
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - Math.min(progress, blueEnd) * circumference}
            strokeLinecap="round"
          />
        )}

        {/* Зеленый сегмент (остальное) */}
        {progress > blueEnd && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#22c55e" // green-500
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference - (blueEnd * circumference + greenProgress * (1 - blueEnd) * circumference)
            }
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Иконка графика внутри */}
      {showIcon && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.4,
            height: size * 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1e293b', // slate-800
            borderRadius: '50%',
            zIndex: 2,
          }}
        >
          <svg
            width={size * 0.25}
            height={size * 0.25}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Иконка восходящего графика */}
            <polyline points="3 12 7 8 11 12 15 8 21 12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
      )}
      </div>
    </>
  );
};

