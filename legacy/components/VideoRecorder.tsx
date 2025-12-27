import React, { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { DURATION_MS } from '../src/constants';

interface VideoRecorderProps {
  containerRef: React.RefObject<HTMLElement>;
  isRecording: boolean;
  onRecordingComplete?: (blob: Blob) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  containerRef, 
  isRecording,
  onRecordingComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const isRecordingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isRecording) return;

    const startRecording = async () => {
      if (!containerRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Устанавливаем размер canvas равным размеру viewport (полный экран)
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Получаем stream с canvas для записи
      const stream = canvas.captureStream(30); // 30 FPS
      const streamRef = { current: stream }; // Сохраняем stream для использования в cleanup

      // Настраиваем MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/webm'; // fallback

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 20_000_000, // 20 Mbps для высокого качества
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
      };

      mediaRecorder.onstop = () => {
        // Убеждаемся, что все данные получены
        if (chunksRef.current.length === 0) {
          console.warn('No data chunks received');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        // Проверяем размер файла
        if (blob.size === 0) {
          console.error('Recorded blob is empty');
          return;
        }

        console.log('Recording completed. File size:', blob.size, 'bytes');
        
        // Скачиваем файл
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guardfolio-ai-narrative-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Даем время на скачивание перед освобождением URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
      };

      // Функция для обновления размера canvas при изменении окна
      const updateCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      updateCanvasSize();

      const handleResize = () => {
        updateCanvasSize();
      };
      window.addEventListener('resize', handleResize);

      // Функция для захвата кадра
      let isCapturing = false;
      let lastCaptureTime = 0;
      const TARGET_FPS = 30; // 30 FPS для стабильности (html2canvas может быть медленным)
      const FRAME_INTERVAL = 1000 / TARGET_FPS;
      let captureTimeout: ReturnType<typeof setTimeout> | null = null;

      // Сначала рисуем несколько кадров на canvas, чтобы stream начал генерироваться
      const initCanvas = async () => {
        try {
          const canvasElement = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#0b1120',
            scale: 1,
            logging: false,
            width: window.innerWidth,
            height: window.innerHeight,
          });
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvasElement, 0, 0);
        } catch (error) {
          console.error('Error initializing canvas:', error);
        }
      };

      // Инициализируем canvas перед началом записи
      await initCanvas();

      // Запускаем запись с timeslice для регулярного получения данных (каждую секунду)
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true;

      const captureFrame = async () => {
        if (!isRecordingRef.current || !ctx) return;

        const now = Date.now();
        const timeSinceLastCapture = now - lastCaptureTime;

        // Пропускаем кадр если еще не прошло достаточно времени
        if (timeSinceLastCapture < FRAME_INTERVAL) {
          captureTimeout = setTimeout(captureFrame, FRAME_INTERVAL - timeSinceLastCapture);
          return;
        }

        if (isCapturing) {
          // Если уже захватываем, планируем следующий кадр позже
          captureTimeout = setTimeout(captureFrame, FRAME_INTERVAL);
          return;
        }

        isCapturing = true;
        lastCaptureTime = now;

        try {
          // Делаем скриншот всего body (весь экран)
          const canvasElement = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#0b1120',
            scale: 1,
            logging: false,
            width: window.innerWidth,
            height: window.innerHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
          });

          // Обновляем размер canvas если нужно
          if (canvas.width !== canvasElement.width || canvas.height !== canvasElement.height) {
            canvas.width = canvasElement.width;
            canvas.height = canvasElement.height;
          }

          // Рендерим скриншот на canvas для записи
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvasElement, 0, 0);

          isCapturing = false;

          // Планируем следующий кадр
          if (isRecordingRef.current) {
            captureTimeout = setTimeout(captureFrame, FRAME_INTERVAL);
          }
        } catch (error) {
          console.error('Error capturing frame:', error);
          isCapturing = false;
          // Планируем следующий кадр даже при ошибке
          if (isRecordingRef.current) {
            captureTimeout = setTimeout(captureFrame, FRAME_INTERVAL);
          }
        }
      };

      // Небольшая задержка перед началом захвата, чтобы MediaRecorder успел инициализироваться
      await new Promise(resolve => setTimeout(resolve, 200));

      // Начинаем захват кадров
      captureFrame();

      // Останавливаем запись через DURATION_MS (15 секунд)
      const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        
        // Сначала останавливаем захват кадров
        isRecordingRef.current = false;
        
        // Даем время на завершение текущего захвата
        setTimeout(() => {
          if (!mediaRecorderRef.current) return;
          
          const recorder = mediaRecorderRef.current;
          const currentStream = streamRef.current;
          
          if (recorder.state === 'recording') {
            // Запрашиваем последние данные
            try {
              recorder.requestData();
            } catch (e) {
              console.warn('Error requesting data:', e);
            }
            
            // Останавливаем запись
            setTimeout(() => {
              if (recorder.state === 'recording') {
                try {
                  recorder.stop();
                } catch (e) {
                  console.error('Error stopping recorder:', e);
                }
              }
              
              // Останавливаем все потоки
              if (currentStream) {
                currentStream.getTracks().forEach(track => {
                  track.stop();
                });
              }
            }, 200);
          } else if (recorder.state !== 'inactive') {
            try {
              recorder.stop();
            } catch (e) {
              console.error('Error stopping recorder:', e);
            }
            if (currentStream) {
              currentStream.getTracks().forEach(track => track.stop());
            }
          }
        }, 300);
      };
      
      const stopTimer = setTimeout(stopRecording, DURATION_MS);

      // Сохраняем общую функцию cleanup
      cleanupRef.current = () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(stopTimer);
        if (captureTimeout) {
          clearTimeout(captureTimeout);
        }
        isRecordingRef.current = false;
        
        // Правильно останавливаем MediaRecorder
        stopRecording();
      };
    };

    startRecording();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isRecording, containerRef, onRecordingComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        pointerEvents: 'none',
        opacity: 0,
      }}
    />
  );
};

export default VideoRecorder;
