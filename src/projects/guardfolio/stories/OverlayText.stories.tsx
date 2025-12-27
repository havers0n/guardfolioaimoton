/**
 * Story для компонента OverlayText
 */

import type { Meta, StoryObj } from '@storybook/react';
import { OverlayText } from '../components/OverlayText';
import { TimelineControls, useTimelineState } from '../components/TimelineControls';
import { getStateAt } from '../timelineStateHelper';

const meta: Meta<typeof OverlayText> = {
  title: 'Guardfolio/OverlayText',
  component: OverlayText,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof OverlayText>;

export const Default: Story = {
  render: () => {
    const { state, Controls } = useTimelineState(2000);
    
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
        <OverlayText state={state} width={1920} height={1080} />
      </div>
    );
  },
};

export const WithNarrative: Story = {
  render: () => {
    // Время когда есть narrative текст
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
        <OverlayText state={state} width={1920} height={1080} />
      </div>
    );
  },
};

