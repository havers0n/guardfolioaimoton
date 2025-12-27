
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from './types';
import { INITIAL_TASKS, REAL_TIME_MESSAGES } from './constants';
import RotatingHeader from './components/RotatingHeader';
import TaskItem from './components/TaskItem';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [progress, setProgress] = useState(0);
  const [currentRealTimeMsg, setCurrentRealTimeMsg] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Simulation speed control
  const STEP_DURATION = 2500;

  // Progress bar logic
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Slow down as it gets closer to 100
        const increment = Math.max(0.1, (100 - prev) / 50);
        return prev + increment;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Real-time message rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTimeMsg(prev => (prev + 1) % REAL_TIME_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Step simulation logic
  useEffect(() => {
    if (currentStepIndex >= tasks.length) return;

    // Set current task to loading
    setTasks(prevTasks => {
      const updated = [...prevTasks];
      updated[currentStepIndex].status = TaskStatus.LOADING;
      return updated;
    });

    const timer = setTimeout(() => {
      setTasks(prevTasks => {
        const updated = [...prevTasks];
        updated[currentStepIndex].status = TaskStatus.COMPLETED;
        return updated;
      });
      setCurrentStepIndex(prev => prev + 1);
    }, STEP_DURATION);

    return () => clearTimeout(timer);
  }, [currentStepIndex, tasks.length]);

  const activeTaskLabel = tasks[currentStepIndex]?.label || "Analysis complete";

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      
      {/* Animated Top Section */}
      <RotatingHeader />

      {/* Main Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
          {activeTaskLabel}... ({Math.floor(progress)}%)
        </h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          Our AI is scanning real-time market data to analyze your portfolio
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-md bg-slate-800/50 h-1.5 rounded-full mb-10 relative overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
        </div>
      </div>

      {/* Task List */}
      <div className="w-full max-w-md">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {/* Real-time Data Footnote */}
      <div className="mt-8 w-full max-w-md bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Real-Time Data</span>
        </div>
        <p className="text-sm text-slate-300 transition-all duration-700 ease-in-out">
          {REAL_TIME_MESSAGES[currentRealTimeMsg]}
        </p>
      </div>

      {/* Subtle background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
};

export default App;
