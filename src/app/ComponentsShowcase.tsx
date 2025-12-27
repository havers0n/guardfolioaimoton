/**
 * ComponentsShowcase - страница для отображения всех компонентов Guardfolio.
 * Используется для визуального тестирования и создания скриншотов через Playwright.
 */

import React, { useState } from 'react';
import {
  OverlayText,
  Logo,
  Chart,
  Header,
  ProgressRing,
  TaskCard,
  TaskCheckmark,
  TaskLabel,
  TaskItem,
  TaskList,
  RealTimeData,
  AnalysisHeader,
  AnalysisDescription,
  ProgressSeparator,
  AnalysisComplete,
} from '../projects/guardfolio/components';
import { getStateAt } from '../projects/guardfolio/timelineStateHelper';
import { TASKS, SUBTITLE, REAL_TIME_MESSAGES } from '../constants';

export function ComponentsShowcase() {
  const [timeMs, setTimeMs] = useState(21000);
  const state = getStateAt(timeMs);

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#0f172a', // slate-900
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '60px',
        overflow: 'auto',
      }}
    >
      {/* Заголовок страницы */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '48px', margin: 0 }}>
          Guardfolio Components Showcase
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '18px', marginTop: '10px' }}>
          Все компоненты библиотеки Guardfolio
        </p>
      </div>

      {/* Контролы времени */}
      <div
        style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}
      >
        <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '10px' }}>
          Время (ms): {timeMs}
        </label>
        <input
          type="range"
          min={0}
          max={25000}
          step={100}
          value={timeMs}
          onChange={(e) => setTimeMs(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Секция: Основные компоненты */}
      <section>
        <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '30px' }}>
          Основные компоненты
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '40px',
          }}
        >
          {/* OverlayText */}
          <div
            style={{
              background: '#1e293b',
              padding: '30px',
              borderRadius: '12px',
              position: 'relative',
              height: '300px',
            }}
          >
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>OverlayText</h3>
            <OverlayText state={state} width={800} height={300} />
          </div>

          {/* Header */}
          <div
            style={{
              background: '#1e293b',
              padding: '30px',
              borderRadius: '12px',
              position: 'relative',
              height: '300px',
            }}
          >
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>Header</h3>
            <Header state={state} width={800} height={300} />
          </div>

          {/* Chart */}
          <div
            style={{
              background: '#1e293b',
              padding: '30px',
              borderRadius: '12px',
              position: 'relative',
              height: '400px',
            }}
          >
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>Chart</h3>
            <Chart state={state} width={800} height={400} />
          </div>

          {/* Logo */}
          <div
            style={{
              background: '#1e293b',
              padding: '30px',
              borderRadius: '12px',
              position: 'relative',
              height: '300px',
            }}
          >
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>Logo</h3>
            <Logo state={getStateAt(23000)} width={800} height={300} />
          </div>
        </div>
      </section>

      {/* Секция: Progress Ring */}
      <section>
        <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '30px' }}>
          Progress Ring
        </h2>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>0%</h3>
            <ProgressRing progress={0} size={120} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>25%</h3>
            <ProgressRing progress={0.25} size={120} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>50%</h3>
            <ProgressRing progress={0.5} size={120} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>75%</h3>
            <ProgressRing progress={0.75} size={120} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>100%</h3>
            <ProgressRing progress={1} size={120} />
          </div>
        </div>
      </section>

      {/* Секция: Task Components */}
      <section>
        <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '30px' }}>
          Task Components
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
          }}
        >
          {/* TaskCheckmark */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>TaskCheckmark</h3>
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TaskCheckmark completed={true} />
                <span style={{ color: '#cbd5e1' }}>Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TaskCheckmark completed={false} />
                <span style={{ color: '#cbd5e1' }}>Pending</span>
              </div>
            </div>
          </div>

          {/* TaskLabel */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>TaskLabel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TaskLabel text="Market Correlation Analysis" />
              <TaskLabel text="Factor Exposure Estimation" />
            </div>
          </div>

          {/* TaskCard */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>TaskCard</h3>
            <TaskCard>
              <TaskCheckmark completed={true} />
              <TaskLabel text="Example Task" />
            </TaskCard>
          </div>

          {/* TaskItem */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>TaskItem</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <TaskItem label="Completed Task" completed={true} />
              <TaskItem label="Pending Task" completed={false} />
            </div>
          </div>

          {/* TaskList */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>TaskList</h3>
            <TaskList tasks={TASKS} completedCount={2} />
          </div>
        </div>
      </section>

      {/* Секция: Analysis Components */}
      <section>
        <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '30px' }}>
          Analysis Components
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '40px',
          }}
        >
          {/* AnalysisHeader */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>AnalysisHeader</h3>
            <AnalysisHeader title="Analysis complete" />
          </div>

          {/* AnalysisDescription */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>AnalysisDescription</h3>
            <AnalysisDescription text={SUBTITLE} />
          </div>

          {/* ProgressSeparator */}
          <div style={{ width: '100%' }}>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>ProgressSeparator</h3>
            <ProgressSeparator width="100%" />
          </div>

          {/* RealTimeData */}
          <div>
            <h3 style={{ color: '#cbd5e1', marginBottom: '20px' }}>RealTimeData</h3>
            <RealTimeData message={REAL_TIME_MESSAGES[0]} />
          </div>
        </div>
      </section>

      {/* Секция: AnalysisComplete (полный экран) */}
      <section>
        <h2 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '30px' }}>
          AnalysisComplete (Full Screen)
        </h2>
        <div
          style={{
            background: '#0f172a',
            padding: '40px',
            borderRadius: '12px',
            position: 'relative',
            minHeight: '800px',
            width: '100%',
          }}
        >
          <AnalysisComplete state={state} width={1920} height={1080} />
        </div>
      </section>
    </div>
  );
}

