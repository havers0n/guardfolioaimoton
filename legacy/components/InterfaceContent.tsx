import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { TASKS, SUBTITLE } from '../src/constants';
import { getTaskProgress, getDynamicHeader, getVisibleTasksCount, getTaskImpactIndex } from '../src/timeline';
import RotatingHeader from './RotatingHeader';
import TaskItem from './TaskItem';
import { Phase } from '../src/constants';
import { Point, normalizePoint, getElementCenter } from '../src/geom';

interface InterfaceContentProps {
  phase: Phase;
  elapsed: number;
  containerRect: DOMRect | null;
  onTaskAnchors: (anchors: Point[]) => void;
}

const InterfaceContent: React.FC<InterfaceContentProps> = ({ 
  phase, 
  elapsed, 
  containerRect,
  onTaskAnchors
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(() => 
    TASKS.map((label, index) => ({
      id: `task-${index}`,
      label,
      status: TaskStatus.PENDING
    }))
  );
  const [localProgress, setLocalProgress] = useState(0);
  const taskRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Report anchors
  useLayoutEffect(() => {
    if (!containerRect) return;

    const anchors: Point[] = [];
    taskRefs.current.forEach((el, index) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = getElementCenter(rect);
        anchors.push(normalizePoint(center, containerRect));
      }
    });
    
    if (anchors.length > 0) {
      onTaskAnchors(anchors);
    }
  }, [containerRect, localTasks, elapsed, onTaskAnchors]);

  // Visibility Logic
  const getVisibility = (element: 'header' | 'title' | 'progress' | 'tasks', taskIndex?: number) => {
    // Basic phase check
    if (elapsed < 6000) return { opacity: 0, transform: 'translateY(20px)' };
    if (elapsed >= 10000) return { opacity: 1, transform: 'translateY(0)' };

    // Standard elements
    if (element === 'header' || element === 'title' || element === 'progress') {
        let start = 0;
        let end = 0;
        switch (element) {
          case 'header': start = 6000; end = 6600; break;
          case 'title': start = 6600; end = 7400; break;
          case 'progress': start = 7400; end = 8000; break;
        }
        
        if (elapsed < start) return { opacity: 0, transform: 'translateY(20px)' };
        if (elapsed >= end) return { opacity: 1, transform: 'translateY(0)' };
        
        const p = (elapsed - start) / (end - start);
        const ease = 1 - Math.pow(1 - p, 3);
        return { opacity: ease, transform: `translateY(${20 * (1 - ease)}px)` };
    }

    // Tasks logic: Causality driven
    if (element === 'tasks' && taskIndex !== undefined) {
        const visibleCount = getVisibleTasksCount(elapsed);
        if (taskIndex < visibleCount) {
             return { opacity: 1, transform: 'translateY(0)' };
        }
        return { opacity: 0, transform: 'translateY(10px)' };
    }
    
    return { opacity: 1, transform: 'translateY(0)' };
  };

  // Logic update (Progress & Tasks status)
  useEffect(() => {
    const progressPercent = getTaskProgress(elapsed);
    setLocalProgress(progressPercent);
      
    const taskProgress = progressPercent / 100;
    
    setLocalTasks(prev => prev.map((task, index) => {
      const taskThreshold = (index + 1) / TASKS.length;
      let status = TaskStatus.PENDING;
      
      if (taskProgress >= taskThreshold) {
        status = TaskStatus.COMPLETED;
      } else if (taskProgress >= taskThreshold - 0.25 && taskProgress > 0) {
        status = TaskStatus.LOADING;
      }
      
      return { ...task, status };
    }));
  }, [elapsed]);

  const dynamicHeader = getDynamicHeader(elapsed) || "System Initializing...";

  // Styles
  const headerStyle = getVisibility('header');
  const titleStyle = getVisibility('title');
  const progressStyle = getVisibility('progress');

  // Highlight logic
  const impactIndex = getTaskImpactIndex(elapsed);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl">
      {/* Header: Rotating Icons */}
      <div style={{ ...headerStyle, transition: 'none' }} className="mb-6 flex justify-center">
        <RotatingHeader />
      </div>

      {/* Title & Subtitle */}
      <div style={{ ...titleStyle, transition: 'none' }} className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {dynamicHeader}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {SUBTITLE}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ ...progressStyle, transition: 'none' }} className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
          <span>Analysis Progress</span>
          <span>{Math.round(localProgress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${localProgress}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-1">
        {localTasks.map((task, index) => {
          const style = getVisibility('tasks', index);
          const isHighlighted = impactIndex === index;
          
          return (
            <div 
              key={task.id}
              ref={el => { taskRefs.current[index] = el; }}
              style={{ ...style, transition: 'none' }} 
            >
              <TaskItem task={task} highlight={isHighlighted} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterfaceContent;
