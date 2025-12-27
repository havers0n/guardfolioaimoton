/**
 * TaskCard - карточка задачи.
 * Контейнер с темно-бирюзовым фоном и светло-зеленой границей.
 */

import React from 'react';

export interface TaskCardProps {
  children: React.ReactNode;
  padding?: string;
  gap?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  children,
  padding = '12px 16px',
  gap = '12px',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        padding,
        background: '#0f766e', // teal-700 (темно-бирюзовый)
        border: '1px solid #5eead4', // teal-200 (светло-зеленая граница)
        borderRadius: '8px',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  );
};

