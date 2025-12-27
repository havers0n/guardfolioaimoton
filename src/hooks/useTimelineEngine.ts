/**
 * useTimelineEngine - React hook для управления timeline engine.
 * Инициализирует engine и предоставляет доступ к состоянию.
 */

import { useEffect, useRef, useState } from 'react';
import { TimelineEngine } from '../engine/timelineEngine';
import { TimeSource } from '../engine/timeSource';
import { EventBus } from '../engine/eventBus';
import { TimelineState } from '../engine/timelineSpec';

export function useTimelineEngine() {
  const engineRef = useRef<TimelineEngine | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);
  const [state, setState] = useState<TimelineState | null>(null);
  const [engine, setEngine] = useState<TimelineEngine | null>(null);
  const [eventBus, setEventBus] = useState<EventBus | null>(null);

  useEffect(() => {
    const timeSource = new TimeSource();
    const eventBusInstance = new EventBus();
    const engineInstance = new TimelineEngine(timeSource, eventBusInstance);

    engineRef.current = engineInstance;
    eventBusRef.current = eventBusInstance;
    
    // Обновляем state для React
    setEngine(engineInstance);
    setEventBus(eventBusInstance);

    // Подписываемся на обновления состояния
    const unsubscribe = eventBusInstance.on('*', () => {
      const currentState = engineInstance.getCurrentState();
      setState(currentState);
    });

    // Запускаем engine
    engineInstance.start();
    console.log('Timeline engine started');

    return () => {
      unsubscribe();
      engineInstance.stop();
      engineRef.current = null;
      eventBusRef.current = null;
      setEngine(null);
      setEventBus(null);
    };
  }, []);

  return {
    engine,
    eventBus,
    state,
  };
}

