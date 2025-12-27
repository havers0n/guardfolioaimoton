/**
 * EventBus - централизованная система событий для timeline engine.
 * Позволяет слоям и системам подписываться на события без прямой зависимости.
 */

export type TimelineEvent =
  | { type: 'phase:change'; phase: string; elapsed: number }
  | { type: 'task:change'; taskIndex: number; status: string }
  | { type: 'beam:fire'; taskIndex: number; progress: number }
  | { type: 'beam:charge'; taskIndex: number; progress: number }
  | { type: 'ui:mode'; mode: 'normal' | 'cinema' | 'implosion' }
  | { type: 'sfx:beamImpact'; taskIndex: number }
  | { type: 'narrative:show'; text: string }
  | { type: 'narrative:hide' };

type EventHandler = (event: TimelineEvent) => void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Подписывается на события определенного типа.
   */
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Возвращает функцию отписки
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  /**
   * Эмитит событие всем подписчикам.
   */
  emit(event: TimelineEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }

    // Также эмитим для подписчиков на '*'
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in wildcard event handler:`, error);
        }
      });
    }
  }

  /**
   * Очищает все подписки.
   */
  clear(): void {
    this.handlers.clear();
  }
}

