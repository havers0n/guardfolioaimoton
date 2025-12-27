# Программ / Scene API Spec v1 - Итоги реализации

## ✅ Реализовано

### 1. Контракты API v1

**Файл:** `src/programs/api-v1.ts`

- ✅ `Program` интерфейс с обязательными `programId`, `durationMs`, `getSceneAt()`
- ✅ `Scene` интерфейс с `sceneId`, `durationMs`, `specVersion`, `timelineSpec`, `elements`, опциональными `seed`, `assets`, `renderFlags`
- ✅ `SceneRef` интерфейс с `sceneId`, `startMs`, `endMs`, `getScene()`
- ✅ `ProgramMetadata` интерфейс для метаданных программы

Все контракты соответствуют спецификации v1.

### 2. RendererPipelineV1

**Файл:** `src/renderer/RendererPipelineV1.ts`

Реализованы все методы согласно спецификации:
- ✅ `compile(program)` - компилирует программу в скомпилированные сцены
- ✅ `setActiveScene(sceneRef, tMs)` - переключает активную сцену с корректным lifecycle
- ✅ `tick(tMs, dtMs, timelineState)` - обновляет элементы с состоянием timeline
- ✅ `inspect()` - возвращает информацию для дебага (elements, bounds, visibility, layout)
- ✅ `getElementBounds(sceneId, elementIndex)` - получение bounding box элемента
- ✅ `getViewport()`, `getLayout()`, `getRootContainer()` - доступ к внутренним данным
- ✅ `dispose()` - очистка ресурсов

Pipeline работает с уже вычисленным `timelineState`, который передаётся из Host (TimelineEngine создаётся в Host).

### 3. Адаптер совместимости

**Файл:** `src/programs/adapters.ts`

- ✅ `createProgramAdapter(legacyProgram, programId)` - преобразует старые Program реализации в новый API v1
- ✅ `sceneDefToScene()` - преобразует SceneDef в Scene согласно API v1

Позволяет использовать существующие Program реализации с новым API без изменений.

### 4. Headless Export API

**Файл:** `src/app/ExportAPI.ts`

Определён интерфейс `ExportAPI` для `window.__EXPORT__`:
- ✅ `ready: boolean` - готовность к экспорту
- ✅ `start(params)` - запуск экспорта с параметрами
- ✅ `onFrame(callback)` - подписка на кадры (push-based)
- ✅ `pullFrame()` - получение следующего кадра (pull-based)
- ✅ `done: Promise<void>` - Promise завершения
- ✅ `abort()` - прерывание экспорта
- ✅ `getState()` - получение текущего состояния timeline
- ✅ `seek(ms)` - перемещение на указанное время

Полная реализация в ExportHost будет следующем шагом.

### 5. Документация

- ✅ `docs/API_V1.md` - полная спецификация API v1
- ✅ `docs/API_V1_MIGRATION.md` - руководство по миграции и использованию
- ✅ `docs/API_V1_IMPLEMENTATION_SUMMARY.md` - этот файл

### 6. Экспорты

**Файл:** `src/programs/index.ts`

Добавлены экспорты для нового API:
```typescript
export type { Program as ProgramV1, SceneRef, Scene, ProgramMetadata } from './api-v1';
export { createProgramAdapter } from './adapters';
```

## ⚠️ Не реализовано (следующие шаги)

### 1. Обновление Host классов

Текущие Host'ы (PlaybackHost, GalleryHost, ExportHost) используют старый API. Для полной миграции нужно:

- Заменить `RendererPipeline` на `RendererPipelineV1`
- Использовать адаптер `createProgramAdapter()` для существующих программ
- Обновить цикл рендеринга:
  ```typescript
  const sceneRef = program.getSceneAt(currentTime);
  pipeline.setActiveScene(sceneRef, currentTime);
  const sceneTime = currentTime - sceneRef.startMs;
  const timelineState = engine.getStateAt(sceneTime);
  pipeline.tick(currentTime, dt, timelineState);
  ```

### 2. Полная реализация Headless Export API

В ExportHost нужно реализовать:
- `start()` метод для запуска экспорта
- `onFrame()` и `pullFrame()` для получения кадров
- `abort()` для прерывания
- Frame capture и передача в callback/pull

### 3. Обновление существующих Program реализаций (опционально)

Можно обновить GuardfolioVideoProgram, ExportProgram, GalleryProgram для прямого соответствия API v1, или продолжать использовать адаптер.

## Использование

### Быстрый старт с адаптером

```typescript
import { GuardfolioVideoProgram } from './programs';
import { createProgramAdapter } from './programs';
import { RendererPipelineV1 } from './renderer/RendererPipelineV1';

// Создаём и адаптируем программу
const legacyProgram = await GuardfolioVideoProgram.create();
const program = createProgramAdapter(legacyProgram, 'guardfolio-video');

// Используем с новым pipeline
const pipeline = new RendererPipelineV1(rootContainer, viewport, computeLayout);
pipeline.compile(program);

// В цикле рендеринга
const sceneRef = program.getSceneAt(currentTime);
if (sceneRef) {
  pipeline.setActiveScene(sceneRef, currentTime);
  const sceneTime = currentTime - sceneRef.startMs;
  const timelineState = engine.getStateAt(sceneTime);
  pipeline.tick(currentTime, dt, timelineState);
}
```

## Архитектурные принципы

Все реализации следуют инвариантам из спецификации:

1. ✅ Host владеет CanvasRenderer и временем
2. ✅ Program/Scene не создают renderer, не управляют DOM, не знают о React
3. ✅ Все вычисления детерминированы
4. ✅ Scene переключается через Pipeline с корректным lifecycle

## Тестирование

Рекомендуется протестировать:
1. Переключение сцен без утечек памяти
2. Детерминизм экспорта (одинаковые кадры при одинаковых параметрах)
3. Корректность lifecycle элементов (mount/unmount/dispose)
4. Работу адаптера с существующими программами

