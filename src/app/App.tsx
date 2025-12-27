/**
 * App - главный компонент приложения.
 * Только glue-код для композиции сцены.
 */

import React from 'react';
import { SceneRoot } from './SceneRoot';

export default function App() {
  return (
    <>
      <SceneRoot />
    </>
  );
}

