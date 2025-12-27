/**
 * TaskLabel - текст задачи.
 * Отображает название задачи зеленым цветом.
 */

import React from 'react';

export interface TaskLabelProps {
  text: string;
  fontSize?: number;
}

export const TaskLabel: React.FC<TaskLabelProps> = ({
  text,
  fontSize = 14,
}) => {
  return (
    <span
      style={{
        color: '#22c55e', // green-500 (яркий зеленый)
        fontSize: `${fontSize}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 400,
      }}
    >
      {text}
    </span>
  );
};

