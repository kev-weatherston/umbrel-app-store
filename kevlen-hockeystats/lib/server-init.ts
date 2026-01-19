// Server-side initialization
// This module ensures scheduler and cache initialization happens only once

import { startScheduler } from './scheduler';

let initialized = false;

export function initializeServer() {
  if (initialized || typeof window !== 'undefined') {
    return;
  }

  // Start scheduler for daily refresh
  startScheduler();
  
  initialized = true;
}

// Auto-initialize when imported on server side
if (typeof window === 'undefined') {
  initializeServer();
}
