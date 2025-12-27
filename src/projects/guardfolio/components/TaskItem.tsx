/**
 * TaskItem - элемент задачи.
 * Композиционный компонент, объединяющий TaskCard, TaskCheckmark и TaskLabel.
 */

import React from 'react';
import { TaskCard } from './TaskCard';
import { TaskCheckmark } from './TaskCheckmark';
import { TaskLabel } from './TaskLabel';

export interface TaskItemProps {
  label: string;
  completed: boolean;
  size?: number;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  label,
  completed,
  size = 24,
}) => {
  return (
    <TaskCard>
      <TaskCheckmark completed={completed} size={size} />
      <TaskLabel text={label} />
    </TaskCard>
  );
};

