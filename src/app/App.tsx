/**
 * App - главный компонент приложения.
 * Только glue-код для композиции сцены.
 * Поддерживает режим /export для экспорта видео и /gallery для Scene Inspector.
 * 
 * Архитектура вариант C:
 * - Каждый route создаёт и владеет своим renderer
 * - Между режимами ничего не переиспользуется
 */

import React from 'react';
import { PlaybackHost } from './PlaybackHost';
import { ExportHost } from './ExportHost';
import { GalleryHost } from './GalleryHost';
import { ComponentsShowcase } from './ComponentsShowcase';

export default function App() {
  const pathname = window.location.pathname;

  // Проверяем, находимся ли мы в режиме экспорта
  if (pathname === '/export') {
    return <ExportHost />;
  }

  // Проверяем, находимся ли мы в режиме gallery (Scene Inspector)
  if (pathname === '/gallery') {
    return <GalleryHost />;
  }

  // Проверяем, находимся ли мы на странице компонентов
  if (pathname === '/components') {
    return <ComponentsShowcase />;
  }

  // Основной режим playback (root route)
  return <PlaybackHost />;
}

