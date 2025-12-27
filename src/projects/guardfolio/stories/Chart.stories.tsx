/**
 * Story для компонента Chart
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Chart } from '../components/Chart';
import { TimelineControls, useTimelineState } from '../components/TimelineControls';
import { getStateAt } from '../timelineStateHelper';

const meta: Meta<typeof Chart> = {
  title: 'Guardfolio/Chart',
  component: Chart,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Chart>;

export const Default: Story = {
  render: () => {
    const { state, Controls } = useTimelineState(5000);
    
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0f172a', // slate-900
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000, width: '400px' }}>
          <Controls />
        </div>
        <Chart state={state} width={1920} height={1080} />
      </div>
    );
  },
};

export const SignalPhase: Story = {
  render: () => {
    const state = getStateAt(2000);
    
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Chart state={state} width={1920} height={1080} />
      </div>
    );
  },
};

export const WithRiskPoints: Story = {
  render: () => {
    // Время когда risk points видны
    const state = getStateAt(6000);
    
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Chart state={state} width={1920} height={1080} />
      </div>
    );
  },
};

