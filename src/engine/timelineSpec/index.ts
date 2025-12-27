/**
 * TimelineSpec - точка входа для версионированного timelineSpec.
 * 
 * Экспортирует текущую версию (v1) как основную.
 * При создании новой версии обновите этот файл для экспорта новой версии.
 */

// Экспортируем текущую версию (v1)
export * from './v1';

// Реэкспортируем для обратной совместимости
export type {
  TimelineState,
  ChartRole,
  ChartRoleParams,
  EnergyBeamEvent,
  Phase,
  MacroPhase,
} from './v1';

export { TIMELINE_SPEC } from './v1';

