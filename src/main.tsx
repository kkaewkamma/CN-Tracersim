import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './presentation/App';
import './presentation/index.css';

const params = new URLSearchParams(window.location.search);
const isLegacy = params.get('legacy') === 'true';
const rootEl = document.getElementById('root');

if (rootEl && !isLegacy) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (rootEl) {
  rootEl.style.display = 'none';
}
