import React from 'react';
import { Phase } from '../src/constants';

interface DistortedInterfaceProps {
  phase: Phase;
  intensity: number;
  children: React.ReactNode;
}

const DistortedInterface: React.FC<DistortedInterfaceProps> = ({ phase, intensity, children }) => {
  const getWrapperStyles = (): React.CSSProperties => {
    switch (phase) {
      case "HOOK":
        // UI anchor hook: очень низкая opacity, сильный blur, никаких искажений
        return {
          filter: `blur(${8 + intensity * 4}px)`,
          transform: `scale(${0.95 + intensity * 0.05})`,
          opacity: 0.1 + intensity * 0.05,
          transition: 'all 0.3s ease-out',
        };
      case "OFF":
        // Искажения и шум - интерфейс размыт и искажен
        return {
          filter: `blur(${intensity * 6}px) contrast(${1 + intensity * 0.8}) saturate(${1 + intensity * 0.5}) hue-rotate(${intensity * 20}deg)`,
          transform: `scale(${1 + intensity * 0.05}) rotate(${intensity * 5}deg) translate(${Math.sin(Date.now() / 200) * intensity * 10}px, ${Math.cos(Date.now() / 250) * intensity * 10}px)`,
          opacity: Math.max(0.2, 1 - intensity * 0.5),
          transition: 'none',
        };
      case "EXPLAIN":
        // Разрыв и напряжение - максимальные искажения
        return {
          filter: `blur(${intensity * 12}px) contrast(${1 + intensity * 1.5}) brightness(${1 - intensity * 0.6}) saturate(${1 + intensity * 1.2}) hue-rotate(${intensity * 40}deg)`,
          transform: `scale(${1 + intensity * 0.15}) rotate(${Math.sin(Date.now() / 60) * intensity * 12}deg) translate(${Math.sin(Date.now() / 50) * intensity * 20}px, ${Math.cos(Date.now() / 70) * intensity * 20}px)`,
          opacity: Math.max(0.15, 1 - intensity * 0.7),
          transition: 'none',
        };
      case "THERE":
        // Пауза - постепенное возвращение к нормальному виду
        return {
          filter: `blur(${(1 - intensity) * 5}px) contrast(${1 + (1 - intensity) * 0.4})`,
          transform: `scale(${1 + (1 - intensity) * 0.04})`,
          opacity: 0.5 + intensity * 0.5,
          transition: 'all 0.3s ease-out',
        };
      case "SEE":
        // Откровение - интерфейс начинает появляться четко
        return {
          filter: `blur(${(1 - intensity) * 2}px)`,
          transform: `scale(${1 + (1 - intensity) * 0.02})`,
          opacity: 0.6 + intensity * 0.4,
          transition: 'all 0.5s ease-out',
        };
      case "CLARITY":
        // Ясность - полностью чистый интерфейс
        return {
          filter: 'blur(0px) contrast(1) brightness(1) saturate(1)',
          transform: 'scale(1) rotate(0deg)',
          opacity: 1,
          transition: 'all 0.8s ease-out',
        };
      default:
        return {};
    }
  };

  const wrapperStyles = getWrapperStyles();

  return (
    <div
      className="w-full h-full"
      style={wrapperStyles}
    >
      {children}
    </div>
  );
};

export default DistortedInterface;

