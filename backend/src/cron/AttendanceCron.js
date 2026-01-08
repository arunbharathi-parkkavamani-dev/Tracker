import cron from "node-cron";
import attendanceService from "../services/attendanceService.js";

// Performance monitoring
class CronMonitor {
  constructor() {
    this.stats = {
      lastRun: null,
      duration: 0,
      employeesProcessed: 0,
      errors: 0,
      avgProcessingTime: 0,
      runs: []
    };
  }

  startRun() {
    return {
      startTime: Date.now(),
      employeesProcessed: 0,
      errors: 0
    };
  }

  endRun(runData) {
    const duration = Date.now() - runData.startTime;

    this.stats.lastRun = new Date();
    this.stats.duration = duration;
    this.stats.employeesProcessed = runData.employeesProcessed;
    this.stats.errors = runData.errors;

    // Keep last 30 runs for averaging
    this.stats.runs.push({
      date: new Date(),
      duration,
      employeesProcessed: runData.employeesProcessed,
      errors: runData.errors
    });

    if (this.stats.runs.length > 30) {
      this.stats.runs.shift();
    }

    // Calculate average processing time
    this.stats.avgProcessingTime = this.stats.runs.reduce((sum, run) =>
      sum + run.duration, 0) / this.stats.runs.length;

    // Log performance metrics
    console.log(`Attendance Cron Performance:`, {
      duration: `${duration}ms`,
      employeesProcessed: runData.employeesProcessed,
      errors: runData.errors,
      avgDuration: `${Math.round(this.stats.avgProcessingTime)}ms`,
      queueStats: attendanceService.getQueueStats()
    });

    // Alert if performance degrades
    if (duration > 300000) { // > 5 minutes
      console.warn(`⚠️  Attendance cron took ${Math.round(duration / 1000)}s - consider optimization`);
    }
  }

  getStats() {
    return this.stats;
  }
}

const monitor = new CronMonitor();

// Main attendance cron - runs at 1:22 AM daily
cron.schedule("22 01 * * *", async () => {
  const runData = monitor.startRun();

  try {
    // console.log('🕐 Starting daily attendance cron...');

    // Process attendance with job queue
    await attendanceService.processDailyAttendance();

    // Get final stats
    const queueStats = attendanceService.getQueueStats();
    runData.employeesProcessed = queueStats.completed;
    runData.errors = queueStats.failed;

    // console.log('✅ Daily attendance cron completed successfully');

  } catch (error) {
    runData.errors++;
    console.error('❌ Daily attendance cron failed:', error);

    // Could integrate with notification service here
    // notificationService.sendAlert('Attendance cron failed', error.message);

  } finally {
    monitor.endRun(runData);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Adjust timezone as needed
});

// Weekend processing cron - runs at 2:00 AM on weekends
cron.schedule("0 02 * * 0,6", async () => {
  try {
    // console.log('🕐 Starting weekend attendance processing...');
    await attendanceService.processWeekendAttendance();
    // console.log('✅ Weekend attendance processing completed');
  } catch (error) {
    console.error('❌ Weekend attendance processing failed:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Health check cron - runs every hour to monitor queue health
cron.schedule("0 * * * *", () => {
  const queueStats = attendanceService.getQueueStats();
  const cronStats = monitor.getStats();

  // Log if queue is backed up
  if (queueStats.queued > 100) {
    console.warn(`⚠️  Attendance queue backed up: ${queueStats.queued} jobs pending`);
  }

  // Log if too many failures
  if (queueStats.failed > 50) {
    console.warn(`⚠️  High failure rate in attendance processing: ${queueStats.failed} failed jobs`);
  }

  // Periodic stats logging (every 6 hours)
  const hour = new Date().getHours();
  if (hour % 6 === 0) {
    console.log('📊 Attendance System Health:', {
      queue: queueStats,
      performance: {
        lastRun: cronStats.lastRun,
        avgDuration: `${Math.round(cronStats.avgProcessingTime)}ms`,
        totalRuns: cronStats.runs.length
      }
    });
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Memory cleanup cron - runs at 3:00 AM daily
cron.schedule("0 03 * * *", () => {
  if (global.gc) {
    // console.log('🧹 Running garbage collection...');
    global.gc();

    const memUsage = process.memoryUsage();
    console.log('Memory after GC:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Export monitor for API access
export { monitor };

// console.log('📅 Attendance cron jobs initialized with performance monitoring');