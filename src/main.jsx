import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';

// Auto-register service worker for PWA caching & offline support
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('ElectroTrack PWA: New update available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('ElectroTrack PWA: App shell cached & ready for offline use.');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

