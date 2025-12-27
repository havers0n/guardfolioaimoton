/**
 * Story для компонента ProgressSeparator
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSeparator } from '../components/ProgressSeparator';

const meta: Meta<typeof ProgressSeparator> = {
  title: 'Guardfolio/ProgressSeparator',
  component: ProgressSeparator,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof ProgressSeparator>;

export const Default: Story = {
  args: {
    width: '100%',
    height: 1,
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ProgressSeparator {...args} />
    </div>
  ),
};

export const Thick: Story = {
  args: {
    width: '100%',
    height: 2,
  },
  render: (args) => (
    <div style={{ width: '400px' }}>
      <ProgressSeparator {...args} />
    </div>
  ),
};

export const Narrow: Story = {
  args: {
    width: '50%',
    height: 1,
  },
  render: (args) => (
    <div style={{ width: '400px', display: 'flex', justifyContent: 'center' }}>
      <ProgressSeparator {...args} />
    </div>
  ),
};

