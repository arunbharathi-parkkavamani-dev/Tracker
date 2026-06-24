import TimeTrackerSession from '../models/TimeTrackerSession.js';
import Task from '../models/Tasks.js';

export default function timetrackersessions() {
  return {
    // ── BEFORE CREATE ──────────────────────────────────────────────────────
    beforeCreate: async ({ body, userId }) => {
      // Ensure only one active session per user globally
      if (body.status === 'active' || !body.status) {
        const existingSession = await TimeTrackerSession.findOne({
          userId: body.userId || userId,
          status: 'active'
        });
        
        if (existingSession) {
          throw new Error('User already has an active time tracking session. Please stop or pause it first.');
        }
      }
      
      body.startTime = body.startTime ? new Date(body.startTime) : new Date();
      if (!body.userId) body.userId = userId;
      
      return body;
    },

    // ── BEFORE UPDATE ──────────────────────────────────────────────────────
    beforeUpdate: async ({ body, docId, userId }) => {
      const session = await TimeTrackerSession.findById(docId);
      if (!session) throw new Error('Session not found');
      
      const now = new Date();
      
      // Handle Pause
      if (body.status === 'paused' && session.status === 'active') {
        const pauses = session.pauses || [];
        pauses.push({ pausedAt: now });
        body.pauses = pauses;
      }
      
      // Handle Resume
      if (body.status === 'active' && session.status === 'paused') {
        const pauses = session.pauses || [];
        if (pauses.length > 0) {
          const lastPause = pauses[pauses.length - 1];
          if (!lastPause.resumedAt) {
            lastPause.resumedAt = now;
            lastPause.duration = Math.max(0, Math.floor((now.getTime() - new Date(lastPause.pausedAt).getTime()) / 1000));
          }
        }
        body.pauses = pauses;
      }
      
      // Handle Complete
      if (body.status === 'completed' && session.status !== 'completed') {
        body.endTime = now;
        
        // Calculate total duration
        let totalElapsed = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);
        
        // Subtract pause durations
        const pauses = session.pauses || [];
        let totalPauseTime = 0;
        
        for (const p of pauses) {
          if (p.resumedAt) {
            totalPauseTime += p.duration || 0;
          } else {
            // If it was paused and now completed without resuming, calculate pause until now
            totalPauseTime += Math.floor((now.getTime() - new Date(p.pausedAt).getTime()) / 1000);
            p.resumedAt = now;
          }
        }
        
        body.duration = Math.max(0, totalElapsed - totalPauseTime);
      }
      
      return body;
    },

    // ── AFTER UPDATE ───────────────────────────────────────────────────────
    afterUpdate: async ({ body, docId }) => {
      if (body.status === 'completed') {
        const session = await TimeTrackerSession.findById(docId);
        if (session && session.duration > 0 && session.taskId) {
          // Add elapsed time to Task.actualHours (assuming duration is in seconds, actualHours might be in hours)
          const durationHours = session.duration / 3600;
          await Task.findByIdAndUpdate(session.taskId, {
            $inc: { actualHours: durationHours }
          });
        }
      }
    }
  };
}
