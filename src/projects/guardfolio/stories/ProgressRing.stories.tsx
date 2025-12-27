/**
 * Story для компонента ProgressRing
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProgressRing } from '../components/ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Guardfolio/ProgressRing',
  component: ProgressRing,
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

export const Default: Story = {
  args: {
    progress: 0.75,
    size: 120,
    strokeWidth: 8,
    showIcon: true,
  },
};

export const Empty: Story = {
  args: {
    progress: 0,
    size: 120,
    strokeWidth: 8,
    showIcon: true,
  },
};

export const Complete: Story = {
  args: {
    progress: 1,
    size: 120,
    strokeWidth: 8,
    showIcon: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    progress: 0.75,
    size: 120,
    strokeWidth: 8,
    showIcon: false,
  },
};

