/**
 * AnalysisComplete - композиционный компонент экрана "Analysis complete".
 * Объединяет все подкомпоненты в единый экран.
 */

import React from 'react';
import type { TimelineState } from '../../../engine/timelineSpec';
import { ProgressRing } from './ProgressRing';
import { AnalysisHeader } from './AnalysisHeader';
import { AnalysisDescription } from './AnalysisDescription';
import { ProgressSeparator } from './ProgressSeparator';
import { TaskList } from './TaskList';
import { RealTimeData } from './RealTimeData';
import { TASKS, SUBTITLE, REAL_TIME_MESSAGES } from '../../../constants';

export interface AnalysisCompleteProps {
  state: TimelineState;
  width?: number;
  height?: number;
}

export const AnalysisComplete: React.FC<AnalysisCompleteProps> = ({
  state,
  width = 1920,
  height = 1080,
}) => {
  const scale = Math.min(width / 1920, height / 1080);
  const centerX = width / 2;
  const safeTop = Math.max(64, height * 0.08);
  const grid = 16 * (width / 1920);

  // Прогресс из state (0..100 -> 0..1)
  const progress = state.taskProgress / 100;
  const completedCount = state.visibleTasksCount;

  // Выбираем сообщение для RealTimeData (циклически)
  const messageIndex = Math.floor((state.elapsed / 2000) % REAL_TIME_MESSAGES.length);
  const realTimeMessage = REAL_TIME_MESSAGES[messageIndex] || REAL_TIME_MESSAGES[0];

  // Показываем только в фазе ANALYSIS_COMPLETE
  if (state.phase !== 'ANALYSIS_COMPLETE') {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX,
        top: safeTop + grid * 4,
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: state.uiOpacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Progress Ring */}
      <div style={{ marginBottom: grid * 2 }}>
        <ProgressRing
          progress={Math.min(1, progress)}
          size={120 * scale}
          strokeWidth={8 * scale}
          showIcon={true}
        />
      </div>

      {/* Заголовок */}
      <div style={{ marginBottom: grid }}>
        <AnalysisHeader title="Analysis complete" scale={scale} />
      </div>

      {/* Описание */}
      <div style={{ marginBottom: grid * 1.5 }}>
        <AnalysisDescription text={SUBTITLE} scale={scale} />
      </div>

      {/* Разделитель */}
      <div style={{ width: '100%', marginBottom: grid * 1.5 }}>
        <ProgressSeparator width="100%" height={1} />
      </div>

      {/* Список задач */}
      <div style={{ width: '100%', marginBottom: grid }}>
        <TaskList tasks={TASKS} completedCount={completedCount} />
      </div>

      {/* Real-Time Data */}
      <div style={{ width: '100%' }}>
        <RealTimeData message={realTimeMessage} />
      </div>
    </div>
  );
};

