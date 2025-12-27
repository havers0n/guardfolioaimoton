/**
 * Timeline Spec Types
 * 
 * Типы для JSON спецификации timeline.
 * Определяют структуру данных для конфигурации сцены.
 */

/**
 * Временной интервал
 */
export interface TimeRange {
  fromMs: number;
  toMs: number;
}

/**
 * Фаза timeline
 */
export type Phase = 
  | 'SIGNAL' 
  | 'RISK_EMERGENCE' 
  | 'BREATHING' 
  | 'FLASH_RAYS' 
  | 'ENERGY_FLOW' 
  | 'ANALYSIS_COMPLETE' 
  | 'CLARITY_LOGO';

/**
 * Макрофаза
 */
export type MacroPhase = 'SIGNAL' | 'INTERPRETATION' | 'STRUCTURE' | 'CLARITY';

/**
 * Окно для narrative текста
 */
export interface NarrativeWindow {
  start: number;
  end: number;
  text: string;
}

/**
 * Динамический заголовок
 */
export interface DynamicHeader {
  start: number;
  end: number;
  text: string;
}

/**
 * Расписание beam событий
 */
export interface BeamEvent {
  start: number;
  end: number;
  taskIndex: number;
}

/**
 * Конфигурация Chart Role
 */
export interface ChartRoleConfig {
  role: 'signal' | 'context' | 'foundation';
  timeRange: TimeRange;
  params: {
    opacity: { start: number; end: number };
    blur: { start: number; end: number };
    scale: { start: number; end: number };
  };
}

/**
 * Конфигурация UI Breathing
 */
export interface UIBreathingConfig {
  timeRange: TimeRange;
  cycleMs: number;
  amplitude: number;
}

/**
 * Конфигурация Brand/Logo
 */
export interface BrandConfig {
  start: number;
  duration: number;
}

/**
 * Конфигурация Implosion
 */
export interface ImplosionConfig {
  start: number;
  duration: number;
}

/**
 * Полная JSON спецификация timeline
 */
export interface TimelineSpecJSON {
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
  duration: number;
  phases: Record<Phase, TimeRange>;
  macroPhases: Record<MacroPhase, TimeRange>;
  narrativeWindows: NarrativeWindow[];
  dynamicHeaders: DynamicHeader[];
  beamSchedule: BeamEvent[];
  chartRoles: ChartRoleConfig[];
  uiBreathing?: UIBreathingConfig;
  brand?: BrandConfig;
  implosion?: ImplosionConfig;
  tasks?: string[];
  brandText?: string;
  tagline?: string;
  subtitle?: string;
}

