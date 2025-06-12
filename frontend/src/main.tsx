import { Buffer } from 'buffer';
// Buffer polyfill – nepieciešams, lai Solana SDK strādātu browser vidē
if (!(window as any).Buffer) (window as any).Buffer = Buffer;

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);