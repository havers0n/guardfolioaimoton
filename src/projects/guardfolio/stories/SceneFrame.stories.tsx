/**
 * SceneFrame - главный story для просмотра композиции сцены.
 * Показывает все компоненты вместе с возможностью управления временем и видимостью.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useMemo } from 'react';
import { OverlayText, Logo, Chart, Header, AnalysisComplete } from '../components';
import { TimelineControls } from '../components/TimelineControls';
import { getStateAt, getDuration } from '../timelineStateHelper';
import type { TimelineState } from '../../../engine/timelineSpec';

const meta: Meta = {
  title: 'Guardfolio/SceneFrame',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

const SceneFrame: React.FC<{
  state: TimelineState;
  showOverlayText: boolean;
  showLogo: boolean;
  showChart: boolean;
  showHeader: boolean;
  showAnalysisComplete: boolean;
  showSafeArea: boolean;
  showGrid: boolean;
}> = ({
  state,
  showOverlayText,
  showLogo,
  showChart,
  showHeader,
  showAnalysisComplete,
  showSafeArea,
  showGrid,
}) => {
  const width = 1920;
  const height = 1080;
  const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
  const displayWidth = width * scale;
  const displayHeight = height * scale;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0f172a', // slate-900
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          position: 'relative',
          background: '#1e293b', // slate-800
          border: '1px solid #334155', // slate-700
        }}
      >
        {/* Safe area overlay */}
        {showSafeArea && (
          <div
            style={{
              position: 'absolute',
              left: Math.max(48, displayWidth * 0.06),
              top: Math.max(64, displayHeight * 0.08),
              right: Math.max(48, displayWidth * 0.06),
              bottom: Math.max(64, displayHeight * 0.10),
              border: '1px dashed rgba(59, 130, 246, 0.3)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Grid overlay */}
        {showGrid && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${16 * scale}px ${16 * scale}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Components */}
        {showChart && <Chart state={state} width={displayWidth} height={displayHeight} />}
        {showHeader && <Header state={state} width={displayWidth} height={displayHeight} />}
        {showOverlayText && (
          <OverlayText state={state} width={displayWidth} height={displayHeight} />
        )}
        {showAnalysisComplete && (
          <AnalysisComplete state={state} width={displayWidth} height={displayHeight} />
        )}
        {showLogo && <Logo state={state} width={displayWidth} height={displayHeight} />}
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => {
    const [timeMs, setTimeMs] = useState(10000);
    const [showOverlayText, setShowOverlayText] = useState(true);
    const [showLogo, setShowLogo] = useState(true);
    const [showChart, setShowChart] = useState(true);
    const [showHeader, setShowHeader] = useState(true);
    const [showAnalysisComplete, setShowAnalysisComplete] = useState(true);
    const [showSafeArea, setShowSafeArea] = useState(false);
    const [showGrid, setShowGrid] = useState(false);

    const state = useMemo(() => getStateAt(timeMs), [timeMs]);
    const duration = getDuration();

    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Controls panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1000,
            width: '400px',
            maxHeight: '100vh',
            overflowY: 'auto',
            background: '#1e293b',
            padding: '16px',
            borderRight: '1px solid #334155',
          }}
        >
          <TimelineControls
            onStateChange={(newState) => {
              setTimeMs(newState.elapsed);
            }}
            initialTime={timeMs}
          />

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#0f172a',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '12px',
              }}
            >
              Видимость компонентов:
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showChart}
                onChange={(e) => setShowChart(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Chart
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showHeader}
                onChange={(e) => setShowHeader(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Header
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showOverlayText}
                onChange={(e) => setShowOverlayText(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              OverlayText
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Logo
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showAnalysisComplete}
                onChange={(e) => setShowAnalysisComplete(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              AnalysisComplete
            </label>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#0f172a',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '12px',
              }}
            >
              Отображение:
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showSafeArea}
                onChange={(e) => setShowSafeArea(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Safe Area
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#cbd5e1',
                fontSize: '14px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Grid
            </label>
          </div>
        </div>

        {/* Scene */}
        <div style={{ flex: 1, marginLeft: '400px' }}>
          <SceneFrame
            state={state}
            showOverlayText={showOverlayText}
            showLogo={showLogo}
            showChart={showChart}
            showHeader={showHeader}
            showAnalysisComplete={showAnalysisComplete}
            showSafeArea={showSafeArea}
            showGrid={showGrid}
          />
        </div>
      </div>
    );
  },
};

