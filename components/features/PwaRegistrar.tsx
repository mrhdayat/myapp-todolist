'use client';

import React, { useEffect } from 'react';

export const PwaRegistrar: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    // In development mode or on localhost: actively unregister any SW and clear old caches
    if (process.env.NODE_ENV !== 'production' || isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // In production on live domain: register SW safely
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Daily Focus PWA Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA Service Worker registration failed:', error);
        });
    });
  }, []);

  return null;
};
