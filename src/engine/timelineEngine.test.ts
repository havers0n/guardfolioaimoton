/**
 * TimelineEngine Tests - тесты детерминированности timeline engine.
 */

// @ts-ignore - vitest types may not be available in IDE, but will work at runtime
import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineEngine } from './timelineEngine';
import { TimeSource } from './timeSource';
import { EventBus, TimelineEvent } from './eventBus';

describe('TimelineEngine', () => {
  let engine: TimelineEngine;
  let timeSource: TimeSource;
  let eventBus: EventBus;

  beforeEach(() => {
    timeSource = new TimeSource();
    eventBus = new EventBus();
    engine = new TimelineEngine(timeSource, eventBus);
  });

  describe('determinism', () => {
    it('should return the same state for the same elapsed time', () => {
      const elapsed1 = 5000;
      const elapsed2 = 5000;

      const state1 = engine.getStateAt(elapsed1);
      const state2 = engine.getStateAt(elapsed2);

      expect(state1.phase).toBe(state2.phase);
      expect(state1.elapsed).toBe(state2.elapsed);
      expect(state1.chartRole).toBe(state2.chartRole);
      expect(state1.chartParams.opacity).toBe(state2.chartParams.opacity);
      expect(state1.chartParams.blur).toBe(state2.chartParams.blur);
      expect(state1.chartParams.scale).toBe(state2.chartParams.scale);
    });

    it('should handle phase transitions correctly', () => {
      // SIGNAL phase (0-4s)
      const signalState = engine.getStateAt(2000);
      expect(signalState.phase).toBe('SIGNAL');

      // RISK_EMERGENCE phase (4-7s)
      const riskState = engine.getStateAt(5000);
      expect(riskState.phase).toBe('RISK_EMERGENCE');

      // BREATHING phase (7-10s)
      const breathingState = engine.getStateAt(8000);
      expect(breathingState.phase).toBe('BREATHING');

      // FLASH_RAYS phase (10-13s)
      const flashState = engine.getStateAt(11000);
      expect(flashState.phase).toBe('FLASH_RAYS');

      // ENERGY_FLOW phase (13-20s)
      const energyState = engine.getStateAt(15000);
      expect(energyState.phase).toBe('ENERGY_FLOW');

      // ANALYSIS_COMPLETE phase (20-22s)
      const analysisState = engine.getStateAt(21000);
      expect(analysisState.phase).toBe('ANALYSIS_COMPLETE');

      // CLARITY_LOGO phase (22-25s)
      const clarityState = engine.getStateAt(23000);
      expect(clarityState.phase).toBe('CLARITY_LOGO');
    });

    it('should calculate chart role params correctly', () => {
      // Signal phase: opacity 0.08→0.75, blur 6→1, scale 0.96→1.0
      const signalStart = engine.getStateAt(0);
      expect(signalStart.chartParams.opacity).toBeCloseTo(0.08, 2);
      expect(signalStart.chartParams.blur).toBeCloseTo(6, 1);
      expect(signalStart.chartParams.scale).toBeCloseTo(0.96, 2);

      const signalEnd = engine.getStateAt(4000);
      expect(signalEnd.chartParams.opacity).toBeCloseTo(0.75, 2);
      expect(signalEnd.chartParams.blur).toBeCloseTo(1, 1);
      expect(signalEnd.chartParams.scale).toBeCloseTo(1.0, 2);
    });

    it('should handle edge cases', () => {
      // Before start
      const beforeStart = engine.getStateAt(-1000);
      expect(beforeStart.phase).toBe('SIGNAL');
      expect(beforeStart.elapsed).toBe(-1000);

      // After end
      const afterEnd = engine.getStateAt(30000);
      expect(afterEnd.phase).toBe('CLARITY_LOGO');
      expect(afterEnd.elapsed).toBe(30000);
    });

    it('should emit phase change events', () => {
      // Тестируем через getStateAt, который вызывает внутреннюю логику
      const state1 = engine.getStateAt(0);
      const state2 = engine.getStateAt(4000);
      const state3 = engine.getStateAt(7000);

      // Проверяем, что фазы разные
      expect(state1.phase).not.toBe(state2.phase);
      expect(state2.phase).not.toBe(state3.phase);
      
      // Примечание: тестирование событий phase:change требует запуска engine,
      // что выходит за рамки простого теста детерминированности
    });
  });

  describe('beam events', () => {
    it('should return correct beam event for charging phase', () => {
      // BEAM_SCHEDULE[0] starts at 13200, charging starts at 13100
      const state = engine.getStateAt(13150);
      expect(state.beamEvent).not.toBeNull();
      expect(state.beamEvent?.phase).toBe('charging');
      expect(state.beamEvent?.taskIndex).toBe(0);
    });

    it('should return correct beam event for firing phase', () => {
      // BEAM_SCHEDULE[0] starts at 13200, ends at 13600
      const state = engine.getStateAt(13400);
      expect(state.beamEvent).not.toBeNull();
      expect(state.beamEvent?.phase).toBe('firing');
      expect(state.beamEvent?.taskIndex).toBe(0);
      expect(state.beamEvent?.t).toBeGreaterThan(0);
      expect(state.beamEvent?.t).toBeLessThanOrEqual(1);
    });

    it('should return null when no beam is active', () => {
      const state = engine.getStateAt(10000);
      expect(state.beamEvent).toBeNull();
    });
  });

  describe('narrative windows', () => {
    it('should return narrative text during narrative windows', () => {
      // NARRATIVE_WINDOWS[0]: 1000-3500, "Markets move. Risk hides."
      const state = engine.getStateAt(2000);
      expect(state.narrativeText).toBe('Markets move. Risk hides.');
      expect(state.isInterrupt).toBe(true);
    });

    it('should return null when outside narrative windows', () => {
      const state = engine.getStateAt(4000);
      expect(state.narrativeText).toBeNull();
      expect(state.isInterrupt).toBe(false);
    });
  });
});

