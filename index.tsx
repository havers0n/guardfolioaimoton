import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';
import { destroyRenderer } from './src/renderer/rendererSingleton';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Cleanup при закрытии приложения
window.addEventListener('beforeunload', () => {
  destroyRenderer();
});
