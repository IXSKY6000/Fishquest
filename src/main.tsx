import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
if (!Capacitor.isNativePlatform())
  registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new Event('fishquest-update'));
    },
    onRegisterError(error) {
      console.warn('PWA : service worker non disponible.', error);
    },
  });
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
