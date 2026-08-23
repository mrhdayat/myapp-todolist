'use client';

import React, { useEffect } from 'react';

export const PwaRegistrar: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Daily Focus PWA Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('PWA Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
};
