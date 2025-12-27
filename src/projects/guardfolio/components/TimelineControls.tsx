/**
 * TimelineControls - компонент для управления временем в Storybook.
 * Предоставляет slider для времени и select для фаз.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { getStateAt, getDuration, getPhases } from '../timelineStateHelper';
import type { TimelineState } from '../../../engine/timelineSpec';

export interface TimelineControlsProps {
  onStateChange?: (state: TimelineState) => void;
  initialTime?: number;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  onStateChange,
  initialTime = 0,
}) => {
  const duration = getDuration();
  const phases = getPhases();
  const [timeMs, setTimeMs] = useState(initialTime);

  const state = useMemo(() => getStateAt(timeMs), [timeMs]);

  React.useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setTimeMs(newTime);
  }, []);

  const handlePhaseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const phase = e.target.value as TimelineState['phase'];
    const phaseData = phases.find(p => p.phase === phase);
    if (phaseData) {
      setTimeMs(phaseData.fromMs);
    }
  }, [phases]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        padding: '16px',
        background: '#1e293b', // slate-800
        borderRadius: '8px',
        marginBottom: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            color: '#cbd5e1', // slate-300
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          Время: {formatTime(timeMs)} / {formatTime(duration)}
        </label>
        <input
          type="range"
          min={0}
          max={duration}
          step={100}
          value={timeMs}
          onChange={handleTimeChange}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: '#334155', // slate-700
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            color: '#cbd5e1',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          Фаза: {state.phase}
        </label>
        <select
          value={state.phase}
          onChange={handlePhaseChange}
          style={{
            width: '100%',
            padding: '8px',
            background: '#334155',
            color: '#cbd5e1',
            border: '1px solid #475569', // slate-600
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {phases.map(phase => (
            <option key={phase.phase} value={phase.phase}>
              {phase.phase} ({formatTime(phase.fromMs)} - {formatTime(phase.toMs)})
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: '#94a3b8', // slate-400
          marginTop: '8px',
        }}
      >
        <div>Макрофаза: {state.macroPhase}</div>
        <div>Интенсивность: {(state.intensity * 100).toFixed(0)}%</div>
        {state.narrativeText && <div>Narrative: "{state.narrativeText}"</div>}
        {state.dynamicHeader && <div>Header: "{state.dynamicHeader}"</div>}
        {state.brandProgress > 0 && (
          <div>Brand Progress: {(state.brandProgress * 100).toFixed(0)}%</div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook для использования TimelineControls в stories
 */
export function useTimelineState(initialTime: number = 0) {
  const [state, setState] = useState(() => getStateAt(initialTime));

  const Controls = useCallback(
    () => <TimelineControls onStateChange={setState} initialTime={initialTime} />,
    [initialTime]
  );

  return { state, Controls };
}

