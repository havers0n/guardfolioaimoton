/**
 * AnalysisHeader - заголовок экрана "Analysis complete".
 */

import React from 'react';

export interface AnalysisHeaderProps {
  title: string;
  scale?: number;
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  title,
  scale = 1,
}) => {
  return (
    <h1
      style={{
        color: '#ffffff',
        fontSize: `${32 * scale}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
        margin: 0,
        textAlign: 'center',
      }}
    >
      {title}
    </h1>
  );
};

