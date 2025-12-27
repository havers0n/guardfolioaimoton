/**
 * Story для компонента TaskCard
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TaskCard } from '../components/TaskCard';
import { TaskCheckmark } from '../components/TaskCheckmark';
import { TaskLabel } from '../components/TaskLabel';

const meta: Meta<typeof TaskCard> = {
  title: 'Guardfolio/TaskCard',
  component: TaskCard,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

export const Default: Story = {
  args: {
    padding: '12px 16px',
    gap: '12px',
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <TaskCard {...args}>
        <TaskCheckmark completed={true} />
        <TaskLabel text="Market Correlation Analysis" />
      </TaskCard>
    </div>
  ),
};

export const WithPendingTask: Story = {
  args: {
    padding: '12px 16px',
    gap: '12px',
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <TaskCard {...args}>
        <TaskCheckmark completed={false} />
        <TaskLabel text="Tail Risk Computation" />
      </TaskCard>
    </div>
  ),
};

export const Compact: Story = {
  args: {
    padding: '8px 12px',
    gap: '8px',
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <TaskCard {...args}>
        <TaskCheckmark completed={true} size={20} />
        <TaskLabel text="Factor Exposure Estimation" fontSize={12} />
      </TaskCard>
    </div>
  ),
};

