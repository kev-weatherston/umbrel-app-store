'use client';

import { useEffect } from 'react';
import { useUmbrel } from '@/lib/use-umbrel';

/**
 * Component that handles Umbrel iframe integration
 * This makes the app appear more native by:
 * - Detecting iframe context
 * - Syncing theme with Umbrel
 * - Removing default margins/padding when in iframe
 */
export default function UmbrelIntegration() {
  const { isInUmbrel } = useUmbrel();

  useEffect(() => {
    if (isInUmbrel) {
      // Add class to body when in Umbrel iframe
      document.body.classList.add('umbrel-iframe');
      
      // Remove default margins/padding for seamless integration
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      // Notify parent that we're ready (optional)
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'appReady', appId: 'kevlen-hockeystats' }, '*');
        }
      } catch (e) {
        // Cross-origin restrictions - that's okay
      }
    }

    return () => {
      if (isInUmbrel) {
        document.body.classList.remove('umbrel-iframe');
      }
    };
  }, [isInUmbrel]);

  return null;
}
