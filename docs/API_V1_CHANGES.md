# Изменения в RendererPipeline V1

## Основные изменения

### 1. Pipeline владеет TimelineEngine

**До:** TimelineEngine создавался в Host и передавался в Pipeline  
**После:** Pipeline создаёт TimelineEngine для каждой сцены в `compile()`

### 2. Метод tick() упрощён

**До:**
```typescript
tick(tMs: number, dtMs: number, timelineState: TimelineState | null): void
```

**После:**
```typescript
tick(programTimeMs: number, dtMs: number): void
```

Pipeline сам:
- определяет активную сцену через `program.getSceneAt(programTimeMs)`
- вычисляет `sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)`
- вычисляет `timelineState = engine.getStateAt(sceneTimeMs)`
- вызывает `setActiveScene()` если сцена сменилась
- обновляет элементы

### 3. Валидация в compile()

Pipeline теперь валидирует:
- SceneRef интервалы (не пересекаются / корректно упорядочены)
- `scene.durationMs === (sceneRef.endMs - sceneRef.startMs)`

### 4. Time domains

Чёткое разделение:
- **ProgramTimeMs**: время от начала Program (0..durationMs)
- **SceneTimeMs**: время от начала активной сцены (0..sceneDurationMs)

Правило вычисления:
```
sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)
sceneRefDurationMs = sceneRef.endMs - sceneRef.startMs
```

### 5. SceneRef boundary rule

`getSceneAt` использует интервалы `[startMs, endMs)` (left-closed, right-open), чтобы на стыке сцен не было двух активных сцен.

### 6. Scene switching semantics

⚠️ **Важно: Элементы создаются в compile(), а не при переключении сцен.**

**Семантика sceneContainer:**
- Каждая сцена имеет собственный `sceneContainer` (PIXI.Container)
- Все элементы сцены добавляются в `sceneContainer` при `compile()`
- При переключении сцен:
  - активный `sceneContainer.visible = true`
  - остальные `sceneContainer.visible = false`
  - контейнеры не пересоздаются

**Правила:**
- Если сцена НЕ сменилась (sceneId тот же): элементы не ремоунтятся, только update
- Если сцена сменилась: переключается видимость sceneContainer (элементы уже созданы в compile())

⚠️ **Запрещено**: Переинициализация элементов при смене сцен. Все элементы создаются в `compile()` и переиспользуются.

## Миграция Host классов

### PlaybackHost

**До:**
```typescript
const sceneState = program.getSceneAt(currentTime);
if (sceneState) {
  sceneState.timelineState = timelineState;
}
pipeline.render({ sceneState, dt });
```

**После:**
```typescript
pipeline.tick(programTimeMs, dtMs);
```

### ExportHost

**До:**
```typescript
const sceneState = program.getSceneAt(currentTime);
sceneState.timelineState = timelineState;
pipeline.render({ sceneState, dt });
```

**После:**
```typescript
pipeline.tick(programTimeMs, fixedDtMs);
captureFrame();
```

## Преимущества

1. **Упрощение Host классов** - они не должны знать о sceneRef, sceneTimeMs, timelineState
2. **Инкапсуляция логики** - вся логика переключения сцен и вычисления состояния в Pipeline
3. **Детерминизм** - Pipeline сам управляет TimelineEngine, гарантирует правильное вычисление состояния
4. **Единый интерфейс** - один метод `tick()` для всех режимов (Playback, Export, Gallery)

