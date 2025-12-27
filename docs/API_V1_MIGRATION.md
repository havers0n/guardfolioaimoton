# Миграция на Program / Scene API v1

## Что было реализовано

### 1. Новые контракты (src/programs/api-v1.ts)

- `Program` - интерфейс программы с обязательными `programId`, `durationMs`, `getSceneAt()`
- `Scene` - интерфейс сцены с `sceneId`, `durationMs`, `specVersion`, `timelineSpec`, `elements`
- `SceneRef` - лёгкая ссылка на сцену с `sceneId`, `startMs`, `endMs`, `getScene()`

### 2. RendererPipelineV1 (src/renderer/RendererPipelineV1.ts)

Новый пайплайн с методами согласно спецификации:
- `compile(program)` - компилирует программу
- `setActiveScene(sceneRef, tMs)` - переключает активную сцену
- `tick(tMs, dtMs, timelineState)` - обновляет элементы
- `inspect()` - методы для дебага

### 3. Адаптер совместимости (src/programs/adapters.ts)

`createProgramAdapter()` - преобразует старые Program реализации в новый API v1.

### 4. Headless Export API (src/app/ExportAPI.ts)

Интерфейс `ExportAPI` для `window.__EXPORT__` с методами:
- `start(params)`
- `onFrame(callback)`
- `pullFrame()`
- `done`
- `abort()`

## Как использовать

### Пример использования адаптера

```typescript
import { GuardfolioVideoProgram } from './programs';
import { createProgramAdapter } from './programs';
import { RendererPipelineV1 } from './renderer/RendererPipelineV1';
import { TimelineEngine } from './engine/timelineEngine';

// Создаём старую программу
const legacyProgram = await GuardfolioVideoProgram.create();

// Адаптируем к API v1
const program = createProgramAdapter(legacyProgram, 'guardfolio-video');

// Создаём pipeline
const pipeline = new RendererPipelineV1(rootContainer, viewport, computeLayout);
pipeline.compile(program);

// Создаём TimelineEngine для активной сцены
const sceneRef = program.getSceneAt(currentTime);
const scene = sceneRef?.getScene();
if (scene && engineRef.current) {
  // Engine уже создан в Host, используем его
  const sceneTime = currentTime - sceneRef.startMs;
  const timelineState = engineRef.current.getStateAt(sceneTime);
  
  // Переключаем сцену и обновляем
  pipeline.setActiveScene(sceneRef, currentTime);
  pipeline.tick(currentTime, dt, timelineState);
}
```

### Миграция Host классов

Текущие Host'ы (PlaybackHost, GalleryHost, ExportHost) используют старый API. Для миграции на API v1:

1. **Заменить RendererPipeline на RendererPipelineV1**
2. **Использовать адаптер для существующих программ**
3. **Обновить цикл рендеринга**:
   - Получать `sceneRef` через `program.getSceneAt(tMs)`
   - Вызывать `pipeline.setActiveScene(sceneRef, tMs)`
   - Вычислять `timelineState` через `engine.getStateAt(sceneTime)`
   - Вызывать `pipeline.tick(tMs, dtMs, timelineState)`

### Обновление существующих Program реализаций

Вместо миграции можно использовать адаптер, или обновить реализации для прямого соответствия API v1:

```typescript
export class MyProgram implements Program {
  readonly programId = 'my-program';
  readonly durationMs = 30000;
  
  getSceneAt(tMs: number): SceneRef | null {
    // Реализация
  }
  
  getScenes(): SceneRef[] {
    // Реализация
  }
  
  getMetadata(): ProgramMetadata {
    return { name: 'My Program', version: '1.0.0' };
  }
}
```

## Следующие шаги

1. Обновить Host классы для использования RendererPipelineV1 (опционально, можно оставить старый API)
2. Реализовать полный Headless Export API в ExportHost
3. Протестировать детерминизм экспорта
4. Обновить существующие Program реализации (опционально, можно использовать адаптер)

