
import React from 'react';
import { Task, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const getStatusStyles = () => {
    switch (task.status) {
      case TaskStatus.COMPLETED:
        return {
          container: "bg-emerald-500/10 border-emerald-500/30",
          icon: "text-emerald-500 border-emerald-500",
          text: "text-emerald-400"
        };
      case TaskStatus.LOADING:
        return {
          container: "bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20",
          icon: "text-blue-500 border-blue-500/30",
          text: "text-white"
        };
      default:
        return {
          container: "bg-slate-800/20 border-slate-800",
          icon: "text-slate-600 border-slate-700",
          text: "text-slate-500"
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`flex items-center gap-4 p-4 mb-3 rounded-xl border transition-all duration-500 ${styles.container}`}>
      <div className="relative w-6 h-6 flex items-center justify-center">
        {task.status === TaskStatus.COMPLETED ? (
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${styles.icon}`}>
            <i className="fas fa-check"></i>
          </div>
        ) : task.status === TaskStatus.LOADING ? (
          <div className="w-6 h-6 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        ) : (
          <div className={`w-6 h-6 rounded-full border ${styles.icon}`}></div>
        )}
      </div>
      <span className={`font-medium transition-colors duration-500 ${styles.text}`}>
        {task.label}
      </span>
    </div>
  );
};

export default TaskItem;
