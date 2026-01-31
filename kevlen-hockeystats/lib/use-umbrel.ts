'use client';

import { useEffect, useState } from 'react';

interface UmbrelContext {
  isInUmbrel: boolean;
  theme: 'light' | 'dark';
}

/**
 * Hook to detect Umbrel iframe context and sync with Umbrel's theme
 * This makes the app appear more native by:
 * - Detecting iframe context
 * - Listening for theme changes from parent
 * - Requesting theme on mount
 */
export function useUmbrel(): UmbrelContext {
  const [isInUmbrel, setIsInUmbrel] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Detect if running in iframe (Umbrel context)
    const inIframe = window.self !== window.top;
    setIsInUmbrel(inIframe);

    if (!inIframe) {
      // Not in iframe, use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      return;
    }

    // In iframe - set up Umbrel integration
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (you may want to restrict this to Umbrel's domain)
      // For now, we'll accept messages from any origin in iframe context
      
      if (event.data && typeof event.data === 'object') {
        // Handle theme change messages
        if (event.data.type === 'theme' || event.data.theme) {
          const newTheme = event.data.theme || event.data.type;
          if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme);
            // Update HTML class for theme
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
          }
        }
      }
    };

    // Listen for messages from parent (Umbrel)
    window.addEventListener('message', handleMessage);

    // Request theme from parent on mount
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'requestTheme' }, '*');
        
        // Also try to detect theme from parent's computed styles
        // This is a fallback if postMessage doesn't work
        setTimeout(() => {
          try {
            // Check parent's body class or computed style
            const parentDoc = (window.parent as any).document;
            if (parentDoc) {
              const parentBody = parentDoc.body || parentDoc.documentElement;
              const parentClasses = parentBody.className || '';
              const isDark = parentClasses.includes('dark') || 
                           parentClasses.includes('theme-dark') ||
                           window.getComputedStyle(parentBody).backgroundColor === 'rgb(17, 24, 39)'; // gray-900
              setTheme(isDark ? 'dark' : 'light');
              document.documentElement.classList.toggle('dark', isDark);
            }
          } catch (e) {
            // Cross-origin restrictions - that's okay, postMessage will handle it
          }
        }, 100);
      }
    } catch (e) {
      // Cross-origin restrictions - that's okay
    }

    // Listen for system theme changes as fallback
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!isInUmbrel) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Set initial theme based on system preference
    setTheme(mediaQuery.matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mediaQuery.matches);

    return () => {
      window.removeEventListener('message', handleMessage);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [isInUmbrel]);

  return { isInUmbrel, theme };
}
