/**
 * Story для компонента TaskList
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TaskList } from '../components/TaskList';
import { TASKS } from '../../../constants';

const meta: Meta<typeof TaskList> = {
  title: 'Guardfolio/TaskList',
  component: TaskList,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

export const Default: Story = {
  args: {
    tasks: TASKS,
    completedCount: 0,
  },
};

export const PartiallyComplete: Story = {
  args: {
    tasks: TASKS,
    completedCount: 2,
  },
};

export const AllComplete: Story = {
  args: {
    tasks: TASKS,
    completedCount: 4,
  },
};

export const CustomTasks: Story = {
  args: {
    tasks: [
      'Parsing your portfolio file',
      'Fetching live market prices',
      'Running AI risk analysis',
      'Generating personalized report',
    ],
    completedCount: 3,
  },
};

