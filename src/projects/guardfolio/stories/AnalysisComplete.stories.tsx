/**
 * Story для компонента AnalysisComplete
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AnalysisComplete } from '../components/AnalysisComplete';
import { TimelineControls, useTimelineState } from '../components/TimelineControls';
import { getStateAt } from '../timelineStateHelper';

const meta: Meta<typeof AnalysisComplete> = {
  title: 'Guardfolio/AnalysisComplete',
  component: AnalysisComplete,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AnalysisComplete>;

export const Default: Story = {
  render: () => {
    const { state, Controls } = useTimelineState(21000);
    
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
        <AnalysisComplete state={state} width={1920} height={1080} />
      </div>
    );
  },
};

export const WithProgress: Story = {
  render: () => {
    // Время когда прогресс активен
    const state = getStateAt(21000);
    
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
        <AnalysisComplete state={state} width={1920} height={1080} />
      </div>
    );
  },
};

