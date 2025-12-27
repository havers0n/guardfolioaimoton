/**
 * Story для компонента TaskCheckmark
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TaskCheckmark } from '../components/TaskCheckmark';

const meta: Meta<typeof TaskCheckmark> = {
  title: 'Guardfolio/TaskCheckmark',
  component: TaskCheckmark,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof TaskCheckmark>;

export const Completed: Story = {
  args: {
    completed: true,
    size: 24,
  },
};

export const Pending: Story = {
  args: {
    completed: false,
    size: 24,
  },
};

export const Large: Story = {
  args: {
    completed: true,
    size: 32,
  },
};

export const Small: Story = {
  args: {
    completed: true,
    size: 16,
  },
};

