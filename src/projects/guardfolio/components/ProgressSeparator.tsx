/**
 * ProgressSeparator - разделитель с градиентом (фиолетовый-синий).
 */

import React from 'react';

export interface ProgressSeparatorProps {
  width?: string;
  height?: number;
}

export const ProgressSeparator: React.FC<ProgressSeparatorProps> = ({
  width = '100%',
  height = 1,
}) => {
  return (
    <div
      style={{
        width,
        height: `${height}px`,
        background: 'linear-gradient(to right, transparent, #8b5cf6 0%, #8b5cf6 80%, #3b82f6 100%, transparent)',
        margin: 0,
      }}
    />
  );
};

