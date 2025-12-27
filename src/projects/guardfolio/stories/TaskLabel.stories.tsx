/**
 * Story для компонента TaskLabel
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TaskLabel } from '../components/TaskLabel';

const meta: Meta<typeof TaskLabel> = {
  title: 'Guardfolio/TaskLabel',
  component: TaskLabel,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof TaskLabel>;

export const Default: Story = {
  args: {
    text: 'Market Correlation Analysis',
    fontSize: 14,
  },
};

export const LongText: Story = {
  args: {
    text: 'Running AI risk analysis and generating personalized report',
    fontSize: 14,
  },
};

export const Large: Story = {
  args: {
    text: 'Factor Exposure Estimation',
    fontSize: 18,
  },
};

export const Small: Story = {
  args: {
    text: 'Tail Risk Computation',
    fontSize: 12,
  },
};

