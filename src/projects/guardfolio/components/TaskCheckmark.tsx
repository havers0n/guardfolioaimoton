/**
 * TaskCheckmark - иконка чекмарка для задачи.
 * Отображает зеленый круг с белой галочкой при завершении,
 * или темный круг без галочки при незавершенной задаче.
 */

import React from 'react';

export interface TaskCheckmarkProps {
  completed: boolean;
  size?: number;
}

export const TaskCheckmark: React.FC<TaskCheckmarkProps> = ({
  completed,
  size = 24,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: completed ? '#22c55e' : '#334155', // green-500 : slate-700
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.3s ease',
      }}
    >
      {completed && (
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
};

