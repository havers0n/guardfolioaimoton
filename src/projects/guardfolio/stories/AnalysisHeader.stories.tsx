/**
 * Story для компонента AnalysisHeader
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AnalysisHeader } from '../components/AnalysisHeader';

const meta: Meta<typeof AnalysisHeader> = {
  title: 'Guardfolio/AnalysisHeader',
  component: AnalysisHeader,
  parameters: {
    layout: 'centered',
    background: '#0f172a',
  },
};

export default meta;
type Story = StoryObj<typeof AnalysisHeader>;

export const Default: Story = {
  args: {
    title: 'Analysis complete',
    scale: 1,
  },
};

export const Large: Story = {
  args: {
    title: 'Analysis complete',
    scale: 1.5,
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Processing complete',
    scale: 1,
  },
};

