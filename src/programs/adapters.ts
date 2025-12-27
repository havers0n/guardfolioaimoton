/**
 * Adapters - адаптеры для совместимости между старым и новым API.
 * 
 * Позволяет использовать старые Program реализации с новым API v1.
 */

import type { Program as LegacyProgram, SceneDef } from './types';
import type { Program, SceneRef, Scene, ProgramMetadata } from './api-v1';
import type { ElementConfig } from '../elements/registry';

/**
 * Адаптер, который преобразует старый Program интерфейс в новый API v1.
 */
export function createProgramAdapter(legacyProgram: LegacyProgram, programId: string): Program {
  const scenes = legacyProgram.getScenes();
  
  // Создаём SceneRef для каждой сцены
  const sceneRefs: SceneRef[] = [];
  let accumulatedTime = 0;
  
  for (const sceneDef of scenes) {
    const startMs = accumulatedTime;
    const endMs = accumulatedTime + sceneDef.durationMs;
    
    sceneRefs.push({
      sceneId: sceneDef.id,
      startMs,
      endMs,
      getScene: () => sceneDefToScene(sceneDef, legacyProgram),
    });
    
    accumulatedTime = endMs;
  }

  return {
    programId,
    durationMs: legacyProgram.getDuration(),
    
    getSceneAt(tMs: number): SceneRef | null {
      const clampedTime = Math.max(0, Math.min(tMs, this.durationMs));
      
      // Находим активную сцену
      for (const sceneRef of sceneRefs) {
        if (clampedTime >= sceneRef.startMs && clampedTime < sceneRef.endMs) {
          return sceneRef;
        }
      }
      
      return null;
    },
    
    getScenes(): SceneRef[] {
      return sceneRefs;
    },
    
    getMetadata(): ProgramMetadata {
      return {
        name: programId,
        version: '1.0.0',
      };
    },
  };
}

/**
 * Преобразует SceneDef в Scene согласно API v1.
 */
function sceneDefToScene(sceneDef: SceneDef, legacyProgram: LegacyProgram): Scene {
  const spec = legacyProgram.getSpec();
  
  if (!spec) {
    throw new Error(`Scene ${sceneDef.id} has no spec`);
  }

  return {
    sceneId: sceneDef.id,
    durationMs: sceneDef.durationMs,
    specVersion: 'timelineSpec/v1',
    timelineSpec: spec,
    elements: legacyProgram.getElementsForScene(sceneDef.id),
  };
}

