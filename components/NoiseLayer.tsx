import React, { useEffect, useRef } from 'react';

interface NoiseLayerProps {
  intensity: number; // 0-1
  opacity?: number;
}

const NoiseLayer: React.FC<NoiseLayerProps> = ({ intensity, opacity = 0.4 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размер canvas равным размеру окна
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = canvas.width;
    const height = canvas.height;

    // Создаем шум
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const noiseIntensity = Math.floor(intensity * 128);

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(Math.random() * noiseIntensity);
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = Math.floor(opacity * 255 * intensity); // A
    }

    ctx.putImageData(imageData, 0, 0);

    // Обновляем при изменении размера окна
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Перерисовываем шум
      const newImageData = ctx.createImageData(canvas.width, canvas.height);
      const newData = newImageData.data;
      for (let i = 0; i < newData.length; i += 4) {
        const value = Math.floor(Math.random() * noiseIntensity);
        newData[i] = value;
        newData[i + 1] = value;
        newData[i + 2] = value;
        newData[i + 3] = Math.floor(opacity * 255 * intensity);
      }
      ctx.putImageData(newImageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [intensity, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 50,
        mixBlendMode: 'multiply',
        opacity: intensity * opacity,
      }}
    />
  );
};

export default NoiseLayer;

