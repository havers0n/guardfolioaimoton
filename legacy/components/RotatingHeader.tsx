
import React from 'react';

const RotatingHeader: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-32 h-32 mb-8">
      {/* Background Circle */}
      <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
      
      {/* Blue Rotating Line (Inner) */}
      <div className="absolute inset-0 animate-spin-slow">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeDasharray="80 300"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Green Rotating Line (Outer) */}
      <div className="absolute inset-0 animate-spin-reverse p-1">
        <svg className="w-full h-full transform rotate-45">
          <circle
            cx="60"
            cy="60"
            r="56"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeDasharray="120 300"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Center Icon */}
      <div className="z-10 bg-slate-900/50 rounded-full p-4 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 9l-5 5-2-2-5 5" />
        </svg>
      </div>
    </div>
  );
};

export default RotatingHeader;
