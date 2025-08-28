import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MagicProvider } from './contexts/MagicContext';

createRoot(document.getElementById("root")!).render(
  <MagicProvider>
    <App />
  </MagicProvider>
);
