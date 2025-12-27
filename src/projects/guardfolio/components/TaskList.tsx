/**
 * TaskList - список задач с чекмарками.
 */

import React from 'react';
import { TaskItem } from './TaskItem';

export interface TaskListProps {
  tasks: string[];
  completedCount: number;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  completedCount,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {tasks.map((task, index) => (
        <TaskItem
          key={index}
          label={task}
          completed={index < completedCount}
        />
      ))}
    </div>
  );
};

