import React, { useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { TASKS, HEADER_CLARITY, SUBTITLE, REAL_TIME_BADGE } from '../src/constants';
import { getTaskAt, getTaskProgress, getRealTimeMessage } from '../src/timeline';
import RotatingHeader from './RotatingHeader';
import TaskItem from './TaskItem';
import { Phase } from '../src/constants';

interface InterfaceContentProps {
  phase: Phase;
  elapsed: number;
  currentRealTimeMsg?: number; // Deprecated: теперь используется getRealTimeMessage
  onProgressUpdate: (progress: number, tasks: Task[]) => void;
}

const InterfaceContent: React.FC<InterfaceContentProps> = ({ 
  phase, 
  elapsed, 
  currentRealTimeMsg,
  onProgressUpdate 
}) => {
  const [localTasks, setLocalTasks] = React.useState<Task[]>(() => 
    TASKS.map((label, index) => ({
      id: `task-${index}`,
      label,
      status: TaskStatus.PENDING
    }))
  );
  const [localProgress, setLocalProgress] = React.useState(0);

  // Синхронизация задач с таймлайном
  useEffect(() => {
    if (phase === "SEE" || phase === "CLARITY") {
      const progressPercent = getTaskProgress(elapsed);
      setLocalProgress(progressPercent);

      // Обновляем задачи
      const taskProgress = progressPercent / 100;
      const updatedTasks = TASKS.map((label, index) => {
        const taskId = `task-${index}`;
        const taskThreshold = (index + 1) / TASKS.length;
        let status = TaskStatus.PENDING;
        
        if (taskProgress >= taskThreshold) {
          status = TaskStatus.COMPLETED;
        } else if (taskProgress >= taskThreshold - 0.25 && taskProgress < taskThreshold) {
          status = TaskStatus.LOADING;
        }
        
        return { id: taskId, label, status };
      });

      setLocalTasks(updatedTasks);
      onProgressUpdate(progressPercent, updatedTasks);
    } else {
      setLocalProgress(0);
      const resetTasks = TASKS.map((label, index) => ({
        id: `task-${index}`,
        label,
        status: TaskStatus.PENDING
      }));
      setLocalTasks(resetTasks);
      onProgressUpdate(0, resetTasks);
    }
  }, [phase, elapsed, onProgressUpdate]);

  const activeTaskLabel = localTasks.find(task => task.status === TaskStatus.LOADING)?.label || 
                         localTasks.find(task => task.status === TaskStatus.PENDING)?.label || 
                         HEADER_CLARITY;

  return (
    <div className="w-full max-w-2xl">
      {/* Animated Top Section */}
      <RotatingHeader />

      {/* Main Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
          {phase === "SEE" && (
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
          )}
          {phase === "CLARITY" ? (
            HEADER_CLARITY
          ) : (
            <>
              {activeTaskLabel}... (
              <span
                style={{
                  filter: 'blur(3px)',
                  opacity: 0.3,
                  display: 'inline-block',
                }}
              >
                {Math.floor(localProgress)}%
              </span>
              )
            </>
          )}
        </h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          {SUBTITLE}
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-md bg-slate-800/50 h-1.5 rounded-full mb-10 relative overflow-hidden mx-auto">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${localProgress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
        </div>
      </div>

      {/* Task List */}
      <div className="w-full max-w-md mx-auto">
        {localTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {/* Real-time Data Footnote */}
      {phase === "CLARITY" && localProgress >= 90 && (
        <div className="mt-8 w-full max-w-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-sm mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{REAL_TIME_BADGE}</span>
          </div>
          <p className="text-sm text-slate-300 transition-all duration-700 ease-in-out">
            {getRealTimeMessage(elapsed)}
          </p>
        </div>
      )}
    </div>
  );
};

export default InterfaceContent;

