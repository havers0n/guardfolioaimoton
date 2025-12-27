/**
 * UILayer - слой для UI интерфейса (заголовки, прогресс, задачи).
 * Миграция из InterfaceContent компонента.
 * 
 * Примечание: Полная миграция UI требует текстового рендеринга и сложной композиции.
 * Для начала создаем упрощенную версию, которая может быть расширена позже.
 */

import { BaseLayer } from './BaseLayer';
import { TimelineState } from '../../engine/timelineSpec';
import * as PIXI from 'pixi.js';
import { TASKS, SUBTITLE } from '../../constants';

export interface UILayerConfig {
  taskAnchors: Array<{ x: number; y: number }>;
  onTaskAnchorsUpdate?: (anchors: Array<{ x: number; y: number }>) => void;
}

export class UILayer extends BaseLayer {
  private config: UILayerConfig | null = null;
  private uiContainer: PIXI.Container | null = null;
  private headerText: PIXI.Text | null = null;
  private subtitleText: PIXI.Text | null = null;
  private progressBar: PIXI.Graphics | null = null;
  private progressBarBg: PIXI.Graphics | null = null;
  private progressText: PIXI.Text | null = null;
  private taskItems: Array<{
    container: PIXI.Container;
    text: PIXI.Text;
    status: 'PENDING' | 'LOADING' | 'COMPLETED';
  }> = [];

  constructor(container: PIXI.Container, viewport: { getWidth(): number; getHeight(): number }) {
    super(container, viewport);
    this.init();
  }

  private init(): void {
    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    this.uiContainer = new PIXI.Container();
    this.uiContainer.x = width / 2;
    this.uiContainer.y = height / 2;
    this.container.addChild(this.uiContainer);

    // Header (rotating icons - упрощенно, можно добавить позже)
    // Пока пропускаем

    // Title & Subtitle
    this.headerText = new PIXI.Text('System Initializing...', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: 'bold',
      align: 'center',
    });
    this.headerText.anchor.x = 0.5;
    this.headerText.anchor.y = 0.5;
    this.headerText.y = -120;
    this.headerText.alpha = 0;
    this.uiContainer.addChild(this.headerText);

    this.subtitleText = new PIXI.Text(SUBTITLE, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14,
      fill: 0x94a3b8, // slate-400
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 400,
    });
    this.subtitleText.anchor.x = 0.5;
    this.subtitleText.anchor.y = 0.5;
    this.subtitleText.y = -90;
    this.subtitleText.alpha = 0;
    this.uiContainer.addChild(this.subtitleText);

    // Progress Bar
    const progressBarWidth = 400;
    const progressBarHeight = 6;

    this.progressBarBg = new PIXI.Graphics();
    this.progressBarBg.roundRect(-progressBarWidth / 2, -60, progressBarWidth, progressBarHeight, 3);
    this.progressBarBg.fill({ color: 0x1e293b, alpha: 0.8 }); // slate-800
    this.progressBarBg.alpha = 0;
    this.uiContainer.addChild(this.progressBarBg);

    this.progressBar = new PIXI.Graphics();
    this.progressBar.roundRect(-progressBarWidth / 2, -60, 0, progressBarHeight, 3);
    this.progressBar.fill({ color: 0x3b82f6 }); // blue-500
    this.progressBar.alpha = 0;
    this.uiContainer.addChild(this.progressBar);

    this.progressText = new PIXI.Text('0%', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 12,
      fill: 0x94a3b8,
      fontWeight: '600',
    });
    this.progressText.anchor.x = 1;
    this.progressText.anchor.y = 0.5;
    this.progressText.x = progressBarWidth / 2 - 10;
    this.progressText.y = -57;
    this.progressText.alpha = 0;
    this.uiContainer.addChild(this.progressText);

    // Task items
    TASKS.forEach((taskLabel, index) => {
      const taskContainer = new PIXI.Container();
      taskContainer.y = -40 + index * 30;

      const taskText = new PIXI.Text(taskLabel, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        fill: 0x94a3b8,
        align: 'left',
      });
      taskText.anchor.x = 0;
      taskText.anchor.y = 0.5;
      taskText.x = -180;
      taskContainer.addChild(taskText);

      this.taskItems.push({
        container: taskContainer,
        text: taskText,
        status: 'PENDING',
      });

      taskContainer.alpha = 0;
      this.uiContainer.addChild(taskContainer);
    });
  }

  /**
   * Устанавливает конфигурацию.
   */
  setConfig(config: UILayerConfig): void {
    this.config = config;
  }

  update(dt: number, state: TimelineState): void {
    if (!this.uiContainer) return;

    const width = this.viewport.getWidth();
    const height = this.viewport.getHeight();

    // Visibility logic
    const getVisibility = (element: 'header' | 'title' | 'progress' | 'tasks', taskIndex?: number) => {
      if (state.elapsed < 6000) return { opacity: 0, y: 20 };
      if (state.elapsed >= 10000) return { opacity: 1, y: 0 };

      if (element === 'header' || element === 'title' || element === 'progress') {
        let start = 0;
        let end = 0;
        switch (element) {
          case 'header': start = 6000; end = 6600; break;
          case 'title': start = 6600; end = 7400; break;
          case 'progress': start = 7400; end = 8000; break;
        }

        if (state.elapsed < start) return { opacity: 0, y: 20 };
        if (state.elapsed >= end) return { opacity: 1, y: 0 };

        const p = (state.elapsed - start) / (end - start);
        const ease = 1 - Math.pow(1 - p, 3);
        return { opacity: ease, y: 20 * (1 - ease) };
      }

      if (element === 'tasks' && taskIndex !== undefined) {
        const visibleCount = state.visibleTasksCount;
        if (taskIndex < visibleCount) {
          return { opacity: 1, y: 0 };
        }
        return { opacity: 0, y: 10 };
      }

      return { opacity: 1, y: 0 };
    };

    // Update header
    if (this.headerText && state.dynamicHeader) {
      this.headerText.text = state.dynamicHeader;
      const vis = getVisibility('header');
      this.headerText.alpha = vis.opacity;
      this.headerText.y = -120 + vis.y;
    }

    // Update subtitle
    if (this.subtitleText) {
      const vis = getVisibility('title');
      this.subtitleText.alpha = vis.opacity;
      this.subtitleText.y = -90 + vis.y;
    }

    // Update progress
    if (this.progressBar && this.progressBarBg && this.progressText) {
      const vis = getVisibility('progress');
      this.progressBarBg.alpha = vis.opacity;
      this.progressBar.alpha = vis.opacity;
      this.progressText.alpha = vis.opacity;

      const progressBarWidth = 400;
      const progress = state.taskProgress / 100;
      this.progressBar.clear();
      this.progressBar.roundRect(-progressBarWidth / 2, -60, progressBarWidth * progress, 6, 3);
      this.progressBar.fill({ color: 0x3b82f6 });

      this.progressText.text = `${Math.round(state.taskProgress)}%`;
    }

    // Update tasks
    this.taskItems.forEach((item, index) => {
      const vis = getVisibility('tasks', index);
      item.container.alpha = vis.opacity;
      item.container.y = -40 + index * 30 + vis.y;

      // Update status
      const taskProgress = state.taskProgress / 100;
      const taskThreshold = (index + 1) / TASKS.length;
      let status: 'PENDING' | 'LOADING' | 'COMPLETED' = 'PENDING';

      if (taskProgress >= taskThreshold) {
        status = 'COMPLETED';
      } else if (taskProgress >= taskThreshold - 0.25 && taskProgress > 0) {
        status = 'LOADING';
      }

      item.status = status;

      // Update text color based on status
      if (status === 'COMPLETED') {
        item.text.style.fill = 0x22c55e; // green-500
      } else if (status === 'LOADING') {
        item.text.style.fill = 0x3b82f6; // blue-500
      } else {
        item.text.style.fill = 0x94a3b8; // slate-400
      }

      // Highlight on impact
      if (state.taskImpactIndex === index) {
        item.text.style.fill = 0x60a5fa; // blue-400
      }
    });

    // Apply UI transforms (opacity, scale, blur)
    this.uiContainer.alpha = state.uiOpacity;
    this.uiContainer.scale.set(state.uiScale);

    // Blur через alpha overlay (не CSS filter)
    // Можно добавить PIXI BlurFilter если нужно, но по требованиям используем alpha overlay

    // Report task anchors (если нужно)
    if (this.config?.onTaskAnchorsUpdate && this.uiContainer) {
      const anchors = this.taskItems.map((item) => {
        // Центр текста задачи
        const globalX = this.uiContainer!.x + item.container.x + item.text.x + item.text.width / 2;
        const globalY = this.uiContainer!.y + item.container.y;
        return {
          x: globalX / width,
          y: globalY / height,
        };
      });
      this.config.onTaskAnchorsUpdate(anchors);
    }
  }

  destroy(): void {
    if (this.uiContainer) {
      this.uiContainer.destroy({ children: true });
      this.uiContainer = null;
    }
    this.headerText = null;
    this.subtitleText = null;
    this.progressBar = null;
    this.progressBarBg = null;
    this.progressText = null;
    this.taskItems = [];
  }
}

