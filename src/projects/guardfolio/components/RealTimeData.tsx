/**
 * RealTimeData - секция с информацией о реальных данных.
 */

import React from 'react';

export interface RealTimeDataProps {
  message: string;
}

export const RealTimeData: React.FC<RealTimeDataProps> = ({ message }) => {
  return (
    <div
      style={{
        padding: '16px',
        background: '#1e293b', // slate-800
        borderRadius: '12px',
        marginTop: '24px',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3b82f6', // blue-500
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          REAL-TIME DATA
        </span>
      </div>

      {/* Сообщение */}
      <div
        style={{
          color: '#94a3b8', // slate-400
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 400,
          lineHeight: '1.5',
        }}
      >
        {message}
      </div>
    </div>
  );
};

