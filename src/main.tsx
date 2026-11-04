import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './presentation/App';
import './presentation/index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

