import * as cron from 'node-cron';
import { refreshStandings } from './cache';

let cronJob: cron.ScheduledTask | null = null;
let isInitialized = false;

/**
 * Starts the scheduler for daily refresh at 6:00 AM
 * Uses server timezone (or UTC if TZ env var is set)
 */
export function startScheduler(): void {
  if (isInitialized) {
    return;
  }
  
  if (cronJob) {
    console.log('Scheduler already started');
    isInitialized = true;
    return;
  }

  // Schedule daily refresh at 6:00 AM
  // Cron format: minute hour day month day-of-week
  // '0 6 * * *' means: at 6:00 AM every day
  const cronExpression = '0 6 * * *';
  
  cronJob = cron.schedule(cronExpression, async () => {
    console.log('Scheduled refresh triggered at 6:00 AM');
    try {
      await refreshStandings();
    } catch (error) {
      console.error('Error during scheduled refresh:', error);
    }
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC',
  });

  console.log('Scheduler started: Daily refresh scheduled for 6:00 AM');
  isInitialized = true;
}

/**
 * Stops the scheduler
 */
export function stopScheduler(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    isInitialized = false;
    console.log('Scheduler stopped');
  }
}

/**
 * Checks if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return cronJob !== null;
}
