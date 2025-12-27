# Program / Scene API Spec v1

## Цель

Единый контракт, который позволяет:
- запускать сцены в Playback / Gallery / Export режимах
- переключать сцены без пересоздания renderer внутри Host (вариант C)
- поддерживать детерминированный экспорт (fixed-step)
- подключать инспекцию/дебаг без зависимости от конкретной сцены

## Термины

- **Host** — владелец renderer и цикла времени (PlaybackHost, GalleryHost, ExportHost)
- **RendererPipeline** — компилирует Program в исполняемую форму и управляет Element lifecycle
- **Program** — "контент/сценарий", который возвращает активную сцену/шот на момент времени t
- **Scene** — описывает один шот: spec таймлайна + набор элементов + правила
- **SceneRef** — лёгкая ссылка на сцену с временными границами

## Инварианты (законы системы)

1. Host всегда владеет CanvasRenderer и временем
2. Program/Scene не создают renderer, не управляют DOM, не знают о React
3. Все визуальные вычисления детерминированы: результат определяется только t, data, seed, spec
4. Scene переключается через Pipeline; старые элементы корректно dispose/detach

## Contract: Program

### Обязательные свойства

- `programId: string` - стабильный идентификатор программы (для логов/кеша)
- `durationMs: number` - общая длительность программы (таймлайн верхнего уровня)

### Обязательные методы

- `getSceneAt(tMs: number): SceneRef | null` - возвращает активную сцену на момент времени tMs в пределах [0..durationMs]

### Опциональные методы (рекомендуется)

- `getScenes(): SceneRef[]` - полный список сцен (для UI/инспектора/экспорта по шотам)
- `getMetadata(): ProgramMetadata` - название, описание, теги, версия

### Требования

- `getSceneAt` должен быть чистым (pure): без side-effects
- `getSceneAt` использует интервалы `[startMs, endMs)` (left-closed, right-open)
- Program должен работать одинаково в Playback и Export режимах

## Contract: Scene

### Обязательные свойства

- `sceneId: string` - идентификатор сцены/шота
- `durationMs: number` - длительность сцены (должна совпадать с `sceneRef.endMs - sceneRef.startMs`)
- `specVersion: string` - версия timeline spec (например "timelineSpec/v1")
- `timelineSpec: CompiledSpec` - декларативный таймлайн сцены
- `elements: ElementConfig[]` - декларативный список элементов

Валидация в compile():
- `scene.durationMs === (sceneRef.endMs - sceneRef.startMs)` (иначе ошибка компиляции)

### Опциональные свойства

- `seed?: number` - фиксирует RNG для сцены (если нужно)
- `assets?: string[]` - список ассетов, которые сцена требует (для prefetch)
- `renderFlags?: { noHud?: boolean; noDebug?: boolean; safeAreaMode?: boolean }` - флаги рендеринга

### Семантика

Scene — это данные + правила, без runtime объектов. Никаких `new CanvasRenderer()`, никаких подписок, никаких таймеров.

## Contract: SceneRef

SceneRef — лёгкая ссылка на сцену. Содержит:

- `sceneId: string` - идентификатор сцены
- `startMs: number` - начало сцены в рамках Program (в ProgramTimeMs)
- `endMs: number` - конец сцены в рамках Program (в ProgramTimeMs)
- `getScene(): Scene` - ленивое получение полного объекта Scene

Инвариант:
- `startMs < endMs`
- SceneRef границы заданы в ProgramTimeMs
- `getSceneAt` использует интервалы `[startMs, endMs)` (left-closed, right-open) чтобы исключить "две сцены на стыке"

## Contract: RendererPipeline (поведенческий)

Pipeline предоставляет:

- `compile(program: Program): void` - подготавливает program к исполнению
  - ⚠️ **Создаёт все элементы для всех сцен один раз** (элементы не пересоздаются при переключении сцен)
  - валидирует SceneRef интервалы (не пересекаются / корректно упорядочены)
  - валидирует Scene.durationMs совпадает с endMs-startMs
  - подготавливает TimelineEngine для каждой сцены
  - создаёт sceneContainer для каждой сцены
  - монтирует все элементы в соответствующие sceneContainer'ы

- `tick(programTimeMs: number, dtMs: number): void` - вычисляет state и обновляет элементы
  - определяет активную сцену через `program.getSceneAt(programTimeMs)`
  - вычисляет `sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)`
  - вычисляет `timelineState = engine.getStateAt(sceneTimeMs)`
  - вызывает `setActiveScene()` если сцена сменилась
  - обновляет элементы

- `setActiveScene(sceneRef: SceneRef | null): void` - переключает сцену и гарантирует корректный lifecycle
  - если сцена не сменилась (sceneId тот же): элементы не ремоунтятся, только update
  - если сцена сменилась: переключает видимость sceneContainer

- `inspect(): PipelineInspectInfo` - read-only методы для дебага (elements list, bounds, visibility, layout)
- `dispose(): void` - очищает все ресурсы

### Time domains

- **ProgramTimeMs**: время от начала Program (0..durationMs)
- **SceneTimeMs**: время от начала активной сцены (0..sceneDurationMs)

Правило вычисления:
```
sceneTimeMs = clamp(programTimeMs - sceneRef.startMs, 0, sceneRefDurationMs)
sceneRefDurationMs = sceneRef.endMs - sceneRef.startMs
```

### Scene switching semantics

⚠️ **Важно: Элементы создаются в compile(), а не при переключении сцен.**

Это обеспечивает:
- Производительность (нет пересоздания элементов)
- Детерминизм (все элементы готовы заранее)
- Простоту lifecycle (только управление видимостью)

#### Семантика sceneContainer

Каждая сцена имеет собственный `sceneContainer` (PIXI.Container):
- Все элементы сцены добавляются в `sceneContainer` при `compile()`
- `sceneContainer` создаётся один раз и не пересоздаётся
- Элементы остаются в памяти на протяжении всего жизненного цикла Pipeline

#### Правила переключения сцен

Определение "смена сцены":
- Смена сцены происходит, если `prev.sceneId !== next.sceneId`

Правила:
- **Если сцена НЕ сменилась**: элементы не ремоунтятся, только update
- **Если сцена сменилась**:
  - активный `sceneContainer.visible = true`
  - остальные `sceneContainer.visible = false`
  - контейнеры не пересоздаются

⚠️ **Запрещено**: Переинициализация элементов при смене сцен. Все элементы создаются в `compile()` и переиспользуются.

#### Пограничные условия

- `getSceneAt` обязан возвращать ровно одну сцену для любого programTimeMs (или null вне диапазона)
- Использовать `[startMs, endMs)` чтобы исключить "две сцены на стыке"

## Lifecycle (внутри одного Host)

### PlaybackHost

```
1. create renderer
2. load program
3. pipeline.compile(program)
4. RAF loop:
   - programTimeMs from realtime timeSource
   - pipeline.tick(programTimeMs, dtMs)
5. cleanup: pipeline.dispose(); renderer.destroy()
```

### ExportHost

```
1. create renderer
2. load program
3. pipeline.compile(program)
4. fixed-step loop:
   while !finished:
     - programTimeMs from fixed-step timeSource
     - pipeline.tick(programTimeMs, fixedDtMs)
     - capture frame
5. resolve done
6. cleanup
```

## Headless Export Spec (v0)

### Цель

Экспорт без React и без UI:
- batch rendering
- CI exports
- API: "render video from data"

### Минимальные требования

- запуск в Node окружении через управляемый браузер (Playwright)
- fixed-step тайминг
- вывод кадров (PNG) или video (ffmpeg)

### API: window.__EXPORT__

```typescript
interface ExportAPI {
  ready: boolean;
  start(params: ExportStartParams): void;
  onFrame(callback: FrameCallback): void;
  pullFrame(): FrameData | null;
  done: Promise<void>;
  abort(): void;
  getState(): TimelineState;
  seek(ms: number): void;
}
```

### Детерминизм (обязательно)

- фиксированный fps/dt
- фиксированный seed
- одинаковые ассеты/шрифты
- отключить любые источники realtime времени

## Использование адаптера

Для использования существующих Program реализаций с новым API v1:

```typescript
import { GuardfolioVideoProgram } from './programs';
import { createProgramAdapter } from './programs';

// Создаём старую программу
const legacyProgram = await GuardfolioVideoProgram.create();

// Адаптируем к API v1
const program = createProgramAdapter(legacyProgram, 'guardfolio-video');

// Используем с RendererPipelineV1
const pipeline = new RendererPipelineV1(rootContainer, viewport, computeLayout);
pipeline.compile(program);

// В цикле рендеринга (Pipeline сам вычисляет sceneRef, sceneTimeMs, timelineState)
pipeline.tick(programTimeMs, dtMs);
```

