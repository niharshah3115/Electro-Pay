import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('electrotrack_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Check if running in standalone mode (already installed PWA)
  const checkInstalledState = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandaloneMode);
    return isStandaloneMode;
  }, []);

  // Detect iOS Safari environment
  const isIOS = typeof window !== 'undefined' && (() => {
    const ua = window.navigator.userAgent;
    const isIPad = /iPad/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/.test(ua));
    return (/iPhone|iPod/.test(ua) || isIPad) && !window.MSStream;
  })();

  const isSafari = typeof window !== 'undefined' && (() => {
    const ua = window.navigator.userAgent;
    return isIOS && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
  })();

  // Listen to beforeinstallprompt & appinstalled events
  useEffect(() => {
    checkInstalledState();

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default mini-infobar or auto-prompt
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem('electrotrack_pwa_banner_dismissed');
      } catch {
        // ignore
      }
    };

    const mediaMatcher = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      setIsInstalled(e.matches);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    if (mediaMatcher.addEventListener) {
      mediaMatcher.addEventListener('change', handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaMatcher.removeEventListener) {
        mediaMatcher.removeEventListener('change', handleDisplayModeChange);
      }
    };
  }, [checkInstalledState]);

  // Online / Offline network event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger installation flow
  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Native browser install prompt (Android, Chrome, Edge, Windows, Mac)
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return choice.outcome;
      } catch (err) {
        console.warn('PWA install prompt failed:', err);
      }
    } else if (isIOS) {
      // Show iOS step-by-step instructions
      setShowIOSModal(true);
      return 'ios_modal';
    } else {
      // Fallback for browsers without direct prompt API
      setShowIOSModal(true);
      return 'fallback_modal';
    }
  }, [deferredPrompt, isIOS]);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('electrotrack_pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  }, []);

  const value = {
    isInstalled,
    isInstallable: (!isInstalled && !!deferredPrompt) || (!isInstalled && isIOS),
    hasPromptEvent: !!deferredPrompt,
    isIOS,
    isSafari,
    isOnline,
    showIOSModal,
    setShowIOSModal,
    bannerDismissed,
    dismissBanner,
    promptInstall,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
