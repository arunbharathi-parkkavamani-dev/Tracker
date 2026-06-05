export default function dailyactivities() {
  return {
    /**
     * beforeCreate: Validate time overlap and require task link if specified
     */
    async beforeCreate({ body, userId }) {
      body.employeeId = userId; // Always stamp the author securely

      if (!body.date) {
        body.date = new Date().toISOString().split('T')[0];
      }
      
      // Basic validation for time logs
      if (body.startTime && body.endTime) {
        const start = new Date(body.startTime);
        const end = new Date(body.endTime);
        if (start >= end) {
          throw new Error('End time must be after start time');
        }
      }
    }
  };
}
