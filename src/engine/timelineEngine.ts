/**
 * TimelineEngine - детерминированный движок timeline.
 * 
 * Основные принципы:
 * - Детерминированность: getStateAt(t) всегда возвращает одно и то же для одного t
 * - Не зависит от React
 * - Использует performance.now() через TimeSource
 * - Эмитит события через EventBus
 * - Использует compiled spec для вычисления состояния
 */

import type { ITimeSource } from './ITimeSource';
import { TimeSource } from './timeSource';
import { EventBus, TimelineEvent } from './eventBus';
import { TimelineState, ChartRole, ChartRoleParams, EnergyBeamEvent } from './timelineSpec';
import { Phase } from '../constants';
import { getPhaseAt, getMacroPhaseAt, getChartRoleAt, isNarrativeInterrupt, getDynamicHeader, getEnergyBeamEvent, getVisibleTasksCount, getTaskImpactIndex, getTaskProgress, getUIBreathing, clamp01, setCompiledSpec, getNarrativeWindow } from '../timeline';
import type { CompiledSpec } from './spec';

export class TimelineEngine {
  private timeSource: ITimeSource;
  private eventBus: EventBus;
  private compiledSpec: CompiledSpec;
  private lastPhase: Phase | null = null;
  private lastState: TimelineState | null = null;
  private rafId: number | null = null;
  private isRunning = false;

  constructor(timeSource: ITimeSource, eventBus: EventBus, compiledSpec: CompiledSpec) {
    this.timeSource = timeSource;
    this.eventBus = eventBus;
    this.compiledSpec = compiledSpec;
    
    // Устанавливаем spec в timeline.ts для использования в функциях
    setCompiledSpec(compiledSpec);
  }

  /**
   * Инициализирует engine.
   */
  start(): void {
    if (this.isRunning) return;
    
    this.timeSource.initialize();
    this.isRunning = true;
    this.lastPhase = null;
    this.tick();
  }

  /**
   * Останавливает engine.
   */
  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Получает состояние timeline для конкретного времени (детерминированно).
   * Используется для seek mode и тестирования.
   */
  getStateAt(elapsed: number): TimelineState {
    const phase = getPhaseAt(elapsed) as Phase;
    const macroPhase = getMacroPhaseAt(elapsed) as any;
    
    // Phase intensity
    const phaseLookup = this.compiledSpec.phases.find(p => p.phase === phase);
    let intensity = 0;
    if (phaseLookup) {
      const duration = phaseLookup.toMs - phaseLookup.fromMs;
      const phaseElapsed = elapsed - phaseLookup.fromMs;
      intensity = Math.max(0, Math.min(1, phaseElapsed / duration));
    }

    // Chart role
    const chartRoleData = getChartRoleAt(elapsed);
    const chartRole = chartRoleData.role;
    const chartParams = chartRoleData.params;

    // UI state
    const isInterrupt = isNarrativeInterrupt(elapsed);
    const uiBreathing = getUIBreathing(elapsed);
    
    // Brand Progress
    let brandProgress = 0;
    if (this.compiledSpec.brand) {
      const { start, duration } = this.compiledSpec.brand;
      brandProgress = elapsed > start 
        ? clamp01((elapsed - start) / duration) 
        : 0;
    }

    // Implosion Logic
    let implosionProgress = 0;
    if (this.compiledSpec.implosion) {
      const { start, duration } = this.compiledSpec.implosion;
      implosionProgress = elapsed > start 
        ? clamp01((elapsed - start) / duration) 
        : 0;
    }
    
    const implosionScale = 1 - implosionProgress;
    const implosionOpacity = 1 - implosionProgress;

    // UI opacity, scale, blur
    let uiOpacity = 1;
    let uiScale = 1;
    let uiBlur = 0;

    // Apply UI breathing effect (7-10s)
    if (phase === 'BREATHING') {
      uiScale = 1 + uiBreathing;
    }

    // Apply implosion (22s+)
    if (implosionProgress > 0) {
      uiOpacity = implosionOpacity;
      uiScale = implosionScale;
    }

    // Cinema Mode (narrative interrupt)
    if (isInterrupt) {
      uiOpacity = 0.2;
      uiScale = 0.9;
      uiBlur = 12;
    }

    // Narrative state
    const narrativeWindow = getNarrativeWindow(elapsed);
    const narrativeText = narrativeWindow?.text || null;
    const dynamicHeader = getDynamicHeader(elapsed);

    // Beam state
    const beamEvent = getEnergyBeamEvent(elapsed);
    const visibleTasksCount = getVisibleTasksCount(elapsed);
    const taskImpactIndex = getTaskImpactIndex(elapsed);
    const taskProgress = getTaskProgress(elapsed);

    const state: TimelineState = {
      elapsed,
      phase,
      macroPhase,
      intensity,
      chartRole,
      chartParams,
      uiOpacity,
      uiScale,
      uiBlur,
      uiBreathing,
      isInterrupt,
      narrativeText,
      dynamicHeader,
      beamEvent,
      visibleTasksCount,
      taskImpactIndex,
      taskProgress,
      brandProgress,
      implosionProgress,
      implosionScale,
      implosionOpacity,
    };

    return state;
  }

  /**
   * Получает текущее состояние (для реального времени).
   */
  getCurrentState(): TimelineState {
    const elapsed = this.timeSource.getElapsed();
    return this.getStateAt(elapsed);
  }

  /**
   * Основной цикл обновления.
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    const state = this.getCurrentState();

    // Эмитим события при смене фазы
    if (this.lastPhase !== state.phase) {
      this.eventBus.emit({
        type: 'phase:change',
        phase: state.phase,
        elapsed: state.elapsed,
      });
      this.lastPhase = state.phase;
    }

    // Эмитим события для beam
    if (state.beamEvent) {
      if (state.beamEvent.phase === 'firing') {
        this.eventBus.emit({
          type: 'beam:fire',
          taskIndex: state.beamEvent.taskIndex,
          progress: state.beamEvent.t,
        });
      } else if (state.beamEvent.phase === 'charging') {
        this.eventBus.emit({
          type: 'beam:charge',
          taskIndex: state.beamEvent.taskIndex,
          progress: state.beamEvent.t,
        });
      }
    }

    // Эмитим события для narrative
    if (state.narrativeText && (!this.lastState || !this.lastState.narrativeText)) {
      this.eventBus.emit({
        type: 'narrative:show',
        text: state.narrativeText,
      });
    } else if (!state.narrativeText && this.lastState?.narrativeText) {
      this.eventBus.emit({ type: 'narrative:hide' });
    }

    // Эмитим события для UI mode
    let uiMode: 'normal' | 'cinema' | 'implosion' = 'normal';
    if (state.isInterrupt) {
      uiMode = 'cinema';
    } else if (state.implosionProgress > 0) {
      uiMode = 'implosion';
    }
    if (!this.lastState || this.lastState.isInterrupt !== state.isInterrupt || 
        this.lastState.implosionProgress !== state.implosionProgress) {
      this.eventBus.emit({
        type: 'ui:mode',
        mode: uiMode,
      });
    }

    this.lastState = state;
    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Устанавливает принудительное время (для seek mode).
   */
  seekTo(elapsed: number): void {
    this.timeSource.setForcedTime(elapsed);
  }

  /**
   * Сбрасывает seek mode.
   */
  resetSeek(): void {
    this.timeSource.setForcedTime(null);
  }
}

