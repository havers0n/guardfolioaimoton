/**
 * Story для компонента Logo
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from '../components/Logo';
import { TimelineControls, useTimelineState } from '../components/TimelineControls';
import { getStateAt } from '../timelineStateHelper';

const meta: Meta<typeof Logo> = {
  title: 'Guardfolio/Logo',
  component: Logo,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  render: () => {
    const { state, Controls } = useTimelineState(22000);
    
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
        <Logo state={state} width={1920} height={1080} />
      </div>
    );
  },
};

export const BrandProgress: Story = {
  render: () => {
    // Время когда brand прогресс активен
    const state = getStateAt(23000);
    
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
        <Logo state={state} width={1920} height={1080} />
      </div>
    );
  },
};

