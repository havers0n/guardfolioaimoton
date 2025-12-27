/**
 * useRecorder - React hook для записи видео через canvas.captureStream.
 * Заменяет html2canvas на прямой захват canvas потока.
 */

import { useEffect, useRef, useState } from 'react';
import { DURATION_MS } from '../src/constants';

export interface RecorderConfig {
  canvas: HTMLCanvasElement | null;
  isRecording: boolean;
  rendererReady?: boolean; // Флаг готовности renderer (обязателен для старта записи)
  onRecordingComplete?: (blob: Blob) => void;
  fps?: number;
  warmupFrames?: number;
  warmupMs?: number; // Альтернатива warmupFrames - время в миллисекундах
}

export function useRecorder(config: RecorderConfig) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const warmupFrameCountRef = useRef(0);
  const warmupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false); // Защита от множественных запусков
  
  // Стабилизируем callback через useRef, чтобы не перезапускать effect
  const onCompleteRef = useRef(config.onRecordingComplete);
  useEffect(() => {
    onCompleteRef.current = config.onRecordingComplete;
  }, [config.onRecordingComplete]);
  
  // Стабилизируем параметры через refs (кроме isRecording, canvas, rendererReady - они в deps)
  const fpsRef = useRef(config.fps || 30);
  const warmupFramesRef = useRef(config.warmupFrames ?? 15); // По умолчанию 15 кадров
  const warmupMsRef = useRef(config.warmupMs ?? 400); // По умолчанию 400ms
  const rendererReadyRef = useRef(config.rendererReady ?? false);
  
  useEffect(() => {
    fpsRef.current = config.fps || 30;
    warmupFramesRef.current = config.warmupFrames ?? 15;
    warmupMsRef.current = config.warmupMs ?? 400;
    rendererReadyRef.current = config.rendererReady ?? false;
  }, [config.fps, config.warmupFrames, config.warmupMs, config.rendererReady]);

  useEffect(() => {
    // Используем config напрямую для isRecording, canvas, rendererReady (они в deps)
    // Остальные параметры через refs
    const isRecording = config.isRecording;
    const canvas = config.canvas;
    const rendererReady = config.rendererReady ?? false;
    
    // Не стартуем запись, если canvas недоступен, renderer не готов или запись не запрошена
    if (!isRecording || !canvas || !rendererReady) {
      // Останавливаем запись, если canvas недоступен
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recorder:', e);
        }
      }
      // Очищаем флаг при остановке
      isRecordingRef.current = false;
      return;
    }

    // Защита от множественных запусков
    if (isRecordingRef.current) {
      console.warn('Recording already in progress, skipping duplicate start');
      return;
    }

    // Проверяем, что canvas действительно существует и является HTMLCanvasElement
    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('Canvas is not a valid HTMLCanvasElement');
      return;
    }

    const startRecording = async () => {
      const fps = fpsRef.current;

      // КРИТИЧЕСКАЯ ПРОВЕРКА: canvas должен быть готов перед captureStream()
      // Диагностический лог перед стартом записи
      console.log('Starting recording:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        isConnected: canvas.isConnected,
        hasContext: !!canvas.getContext('2d'),
      });

      // Проверяем размеры canvas
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas has zero dimensions, cannot start recording');
        return;
      }

      // Проверяем, что canvas в DOM
      if (!canvas.isConnected) {
        console.error('Canvas is not connected to DOM, cannot start recording');
        return;
      }

      // Ждём несколько RAF для гарантии, что Pixi начал рендерить
      await new Promise(resolve => {
        let frameCount = 0;
        const checkFrames = () => {
          frameCount++;
          if (frameCount >= 5) {
            resolve(undefined);
          } else {
            requestAnimationFrame(checkFrames);
          }
        };
        requestAnimationFrame(checkFrames);
      });

      // Получаем stream с canvas
      const stream = canvas.captureStream(fps);
      streamRef.current = stream;

      // Диагностический лог после получения stream
      console.log('Stream created:', {
        videoTracks: stream.getVideoTracks().length,
        trackState: stream.getVideoTracks()[0]?.readyState,
      });

      // Проверяем, что stream имеет video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.error('No video tracks in stream');
        return;
      }

      // Ждем, пока track станет активным (с таймаутом)
      const videoTrack = videoTracks[0];
      if (videoTrack.readyState !== 'live') {
        const maxWait = 2000; // 2 секунды максимум
        const startTime = Date.now();
        await new Promise<void>((resolve, reject) => {
          const checkReady = () => {
            if (videoTrack.readyState === 'live') {
              resolve();
            } else if (Date.now() - startTime > maxWait) {
              reject(new Error('Video track did not become live within timeout'));
            } else {
              setTimeout(checkReady, 50);
            }
          };
          checkReady();
        }).catch((error) => {
          console.warn('Video track ready check:', error);
          // Продолжаем даже если track не стал live - некоторые браузеры могут работать иначе
        });
      }

      // Устанавливаем флаг перед началом warmup
      isRecordingRef.current = true;

      // Warm-up: ждём несколько кадров ИЛИ время перед началом записи
      // Это гарантирует, что stream начал генерировать кадры и canvas рендерится
      const warmupFrames = warmupFramesRef.current;
      const warmupMs = warmupMsRef.current;
      const frameTime = 1000 / fps;
      
      warmupFrameCountRef.current = 0;
      const warmupStartTime = Date.now();
      
      // Очищаем предыдущий интервал, если есть
      if (warmupIntervalRef.current) {
        clearInterval(warmupIntervalRef.current);
      }
      
      warmupIntervalRef.current = setInterval(() => {
        warmupFrameCountRef.current++;
        const elapsedMs = Date.now() - warmupStartTime;
        
        // Проверяем, что track всё ещё активен
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
          console.error('Video track ended during warmup', {
            tracksCount: videoTracks.length,
            trackState: videoTracks[0]?.readyState,
            canvasConnected: canvas.isConnected,
          });
          clearInterval(warmupIntervalRef.current!);
          warmupIntervalRef.current = null;
          isRecordingRef.current = false;
          // Останавливаем stream при ошибке
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          return;
        }

        // Завершаем warmup если достигли нужного количества кадров ИЛИ времени
        const framesReady = warmupFrameCountRef.current >= warmupFrames;
        const timeReady = elapsedMs >= warmupMs;
        
        if (framesReady || timeReady) {
          clearInterval(warmupIntervalRef.current!);
          warmupIntervalRef.current = null;
          console.log('Warmup complete, starting MediaRecorder', {
            frames: warmupFrameCountRef.current,
            elapsedMs,
            framesReady,
            timeReady,
          });
          startMediaRecorder(stream, canvas);
        }
      }, frameTime);
    };

    const startMediaRecorder = (stream: MediaStream, canvas: HTMLCanvasElement) => {
      // Проверяем, что stream все еще активен
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        console.error('Stream has no video tracks');
        return;
      }
      
      // Проверяем readyState track перед стартом записи
      const videoTrack = videoTracks[0];
      
      // Диагностический лог состояния track
      console.log('Video track state before recording:', {
        readyState: videoTrack.readyState,
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        canvasConnected: canvas.isConnected,
        canvasSize: `${canvas.width}x${canvas.height}`,
      });

      if (videoTrack.readyState === 'ended') {
        console.error('Video track has ended before recording start');
        // Логируем дополнительную диагностику
        console.error('Track ended diagnostics:', {
          canvasConnected: canvas.isConnected,
          canvasSize: `${canvas.width}x${canvas.height}`,
          streamActive: stream.active,
        });
        return;
      }
      
      // Если track не live, предупреждаем, но продолжаем (некоторые браузеры могут работать иначе)
      if (videoTrack.readyState !== 'live') {
        console.warn('Video track is not live, but attempting to record anyway. State:', videoTrack.readyState);
      }

      // Добавляем обработчик на случай, если track завершится во время записи
      videoTrack.onended = () => {
        console.error('Video track ended during recording:', {
          canvasConnected: canvas.isConnected,
          canvasSize: `${canvas.width}x${canvas.height}`,
          recorderState: mediaRecorder?.state,
        });
      };

      // Настраиваем MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/webm';

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 25_000_000, // 25 Mbps для высокого качества (файл будет в MB, не KB)
        });
      } catch (e) {
        console.error('Failed to create MediaRecorder:', e);
        return;
      }

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
        if (chunksRef.current.length === 0) {
          console.warn('No data chunks received');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        
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
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        // Используем стабильный ref для callback
        if (onCompleteRef.current) {
          onCompleteRef.current(blob);
        }
      };

      // Запускаем запись с timeslice для регулярного получения данных
      try {
        if (mediaRecorder.state === 'inactive') {
          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
        } else {
          console.warn('MediaRecorder is already in state:', mediaRecorder.state);
        }
      } catch (e) {
        console.error('Failed to start MediaRecorder:', e);
      }

      // Останавливаем запись через DURATION_MS
      const stopTimer = setTimeout(() => {
        stopRecording(mediaRecorder, stream);
      }, DURATION_MS);

      // Сохраняем timer для cleanup
      (mediaRecorder as any).__stopTimer = stopTimer;
    };

    const stopRecording = (recorder: MediaRecorder, stream: MediaStream) => {
      console.log('Stopping recording, recorder state:', recorder.state);
      
      if (recorder.state === 'recording') {
        try {
          // Запрашиваем финальные данные
          recorder.requestData();
        } catch (e) {
          console.warn('Error requesting data:', e);
        }
        
        // Ждём перед остановкой для получения данных
        setTimeout(() => {
          if (recorder.state === 'recording') {
            try {
              recorder.stop();
              console.log('Recorder stopped successfully');
            } catch (e) {
              console.error('Error stopping recorder:', e);
            }
          }
          
          // Останавливаем все потоки после остановки записи
          setTimeout(() => {
            stream.getTracks().forEach(track => {
              track.stop();
              console.log('Track stopped:', track.id);
            });
          }, 100);
        }, 200);
      } else if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (e) {
          console.error('Error stopping recorder:', e);
        }
        stream.getTracks().forEach(track => track.stop());
      }
    };

    startRecording();

    return () => {
      // Cleanup: останавливаем все процессы записи
      console.log('useRecorder cleanup: stopping all recording processes');
      
      // Останавливаем warmup интервал
      if (warmupIntervalRef.current) {
        clearInterval(warmupIntervalRef.current);
        warmupIntervalRef.current = null;
      }
      
      // Останавливаем MediaRecorder
      if (mediaRecorderRef.current) {
        const timer = (mediaRecorderRef.current as any).__stopTimer;
        if (timer) {
          clearTimeout(timer);
        }
        
        if (mediaRecorderRef.current.state === 'recording') {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
            console.error('Error stopping recorder in cleanup:', e);
          }
        }
      }

      // Останавливаем все tracks и очищаем stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped in cleanup:', track.id);
        });
        streamRef.current = null;
      }

      // Сбрасываем все refs
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      isRecordingRef.current = false;
      warmupFrameCountRef.current = 0;
    };
  }, [config.isRecording, config.canvas, config.rendererReady]); // Только примитивы в deps
}

