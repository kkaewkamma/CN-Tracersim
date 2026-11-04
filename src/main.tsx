import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './presentation/App';
import './presentation/index.css';

const params = new URLSearchParams(window.location.search);
const isLegacy = params.get('legacy') === 'true';
const rootEl = document.getElementById('root');

// Trigger background Service Worker update check to guarantee latest release
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.update();
    }
  });
}

if (rootEl && !isLegacy) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (rootEl) {
  rootEl.style.display = 'none';
}
