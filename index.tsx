import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';

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

// Cleanup теперь не требуется - каждый Host управляет своим renderer
