/**
 * DebugHUD - компонент для отображения отладочной информации и управления временем.
 * 
 * Показывает:
 * - elapsed (ms)
 * - phase
 * - fps
 * - mode
 * - quality preset
 * - recording state
 * 
 * Hotkeys:
 * - Space: pause/resume
 * - Left/Right: seek ±100ms
 * - Shift+Left/Right: seek ±1000ms
 * - '.': step frame (1 frame forward)
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import type { Scene } from '../scenes/guardfolio';
import type { TimelineState } from '../engine/timelineSpec';

interface DebugHUDProps {
  scene: Scene | null;
  isRecording?: boolean;
}

interface HUDData {
  elapsed: number;
  phase: string;
  fps: number;
  mode: string;
  quality: string;
  isRecording: boolean;
  isRunning: boolean;
}

export function DebugHUD({ scene, isRecording = false }: DebugHUDProps) {
  const [hudData, setHudData] = useState<HUDData>({
    elapsed: 0,
    phase: 'N/A',
    fps: 0,
    mode: 'N/A',
    quality: 'N/A',
    isRecording: false,
    isRunning: false,
  });

  const fpsRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const UPDATE_INTERVAL_MS = 50; // 20 раз в секунду (1000 / 50 = 20)

  // Throttled update function
  const updateHUD = useCallback(() => {
    const now = performance.now();
    
    // Throttle: обновляем не чаще чем раз в UPDATE_INTERVAL_MS
    if (now - lastUpdateTimeRef.current < UPDATE_INTERVAL_MS) {
      return;
    }
    lastUpdateTimeRef.current = now;

    if (!scene || !scene.isReady()) {
      return;
    }

    try {
      const state: TimelineState = scene.getState();
      
      // FPS calculation
      fpsRef.current.frames++;
      const fpsElapsed = now - fpsRef.current.lastTime;
      let fps = hudData.fps; // Используем предыдущее значение по умолчанию
      
      if (fpsElapsed >= 1000) {
        fps = Math.round((fpsRef.current.frames * 1000) / fpsElapsed);
        fpsRef.current = { frames: 0, lastTime: now };
      }
      
      setHudData({
        elapsed: Math.round(state.elapsed),
        phase: state.phase,
        fps,
        mode: scene.getMode(),
        quality: scene.getQuality(),
        isRecording,
        isRunning: scene.isRunning(),
      });
    } catch (error) {
      console.warn('[DebugHUD] Error getting scene state:', error);
    }
  }, [scene, isRecording]);

  // RAF loop для обновления HUD
  useEffect(() => {
    const tick = () => {
      updateHUD();
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateHUD]);

  // Hotkeys обработка
  useEffect(() => {
    if (!scene || !scene.isReady()) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем hotkeys если фокус на input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (scene.isRunning()) {
            scene.stop();
          } else {
            scene.start();
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Left: seek -1000ms
            const state = scene.getState();
            scene.seek(state.elapsed - 1000);
          } else {
            // Left: seek -100ms
            const state = scene.getState();
            scene.seek(state.elapsed - 100);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Right: seek +1000ms
            const state = scene.getState();
            scene.seek(state.elapsed + 1000);
          } else {
            // Right: seek +100ms
            const state = scene.getState();
            scene.seek(state.elapsed + 100);
          }
          break;

        case 'Period':
          e.preventDefault();
          // Step frame: seek +1 frame (при 60fps это ~16.67ms, используем 17ms)
          const state = scene.getState();
          scene.seek(state.elapsed + 17);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scene]);

  if (!scene || !scene.isReady()) {
    return null;
  }

  return (
    <div
      className="fixed top-4 left-4 z-50 bg-black/80 text-white text-xs font-mono p-3 rounded border border-white/20 backdrop-blur-sm"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="space-y-1">
        <div>
          <span className="text-white/60">elapsed:</span>{' '}
          <span className="text-white font-semibold">{hudData.elapsed}ms</span>
        </div>
        <div>
          <span className="text-white/60">phase:</span>{' '}
          <span className="text-white font-semibold">{hudData.phase}</span>
        </div>
        <div>
          <span className="text-white/60">fps:</span>{' '}
          <span className="text-white font-semibold">{hudData.fps}</span>
        </div>
        <div>
          <span className="text-white/60">mode:</span>{' '}
          <span className="text-white font-semibold">{hudData.mode}</span>
        </div>
        <div>
          <span className="text-white/60">quality:</span>{' '}
          <span className="text-white font-semibold">{hudData.quality}</span>
        </div>
        <div>
          <span className="text-white/60">recording:</span>{' '}
          <span className={hudData.isRecording ? 'text-red-400 font-semibold' : 'text-white/60'}>
            {hudData.isRecording ? 'ON' : 'OFF'}
          </span>
        </div>
        <div>
          <span className="text-white/60">running:</span>{' '}
          <span className={hudData.isRunning ? 'text-green-400 font-semibold' : 'text-white/60'}>
            {hudData.isRunning ? 'YES' : 'NO'}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-white/40">
        <div>Space: pause/resume</div>
        <div>←/→: seek ±100ms</div>
        <div>Shift+←/→: seek ±1s</div>
        <div>.: step frame</div>
      </div>
    </div>
  );
}

