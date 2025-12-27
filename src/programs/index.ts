/**
 * Programs Module - экспорт всех программ.
 */

export { GuardfolioVideoProgram } from './video/GuardfolioVideoProgram';
export { GalleryProgram } from './gallery/GalleryProgram';
export { ExportProgram } from './export/ExportProgram';
export type { Program, SceneDef, SceneState, Transition, TransitionType } from './types';

// API v1
export type { Program as ProgramV1, SceneRef, Scene, ProgramMetadata } from './api-v1';
export { createProgramAdapter } from './adapters';

