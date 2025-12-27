/**
 * AnalysisDescription - описание под заголовком.
 */

import React from 'react';

export interface AnalysisDescriptionProps {
  text: string;
  scale?: number;
}

export const AnalysisDescription: React.FC<AnalysisDescriptionProps> = ({
  text,
  scale = 1,
}) => {
  return (
    <p
      style={{
        color: '#ffffff',
        fontSize: `${14 * scale}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        margin: 0,
        textAlign: 'center',
        lineHeight: '1.5',
      }}
    >
      {text}
    </p>
  );
};

