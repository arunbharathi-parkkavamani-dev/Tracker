import cron from "node-cron";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
// import Holiday from "../models/Holiday.js";
import dayjs from "dayjs";

// Run job every day at 08:52 AM
cron.schedule("52 08 * * *", async () => {
  try {
    console.log("Running daily attendance cron...");

    const today = dayjs().startOf("day").toDate();
    const employees = await Employee.find();
    console.log(`Total employees to process: ${employees.length}`);
    console.log(employees.map(e => e.id));

    for (const emp of employees) {
      // 1. Check if today's record already exists
      const existingRecord = await Attendance.findOne({
        employee: emp._id,
        date: today,
      });
      console.log(`Employee: ${emp.id}, Existing Record:`, existingRecord);

      if (existingRecord) {
        // Record already exists → update if needed (like unchecked check-in later in day)
        if (existingRecord.status == "Week Off" || !existingRecord.checkOut) {
          existingRecord.status = "Unchecked";
          await existingRecord.save();
        }
        continue; // Skip further logic
      }

      // 2. If no record → check holiday/weekend
      const dayOfWeek = dayjs(today).day(); // 0 = Sunday, 6 = Saturday
      let isWeekend = false;

      if (dayOfWeek === 0) {
        // Sunday always week off
        isWeekend = true;
      } else if (dayOfWeek === 6) {
        // Saturday → check alternate week off
        const lastSaturday = dayjs(today).subtract(7, "day").startOf("day").toDate();
        const lastWeekRecord = await Attendance.findOne({
          employee: emp._id,
          date: lastSaturday,
          status: "Week Off",
        });

        // If last Saturday was Week Off → this Saturday is working
        // If last Saturday was working → this Saturday is Week Off
        isWeekend = !lastWeekRecord;
      }

      // const holiday = await Holiday.findOne({ date: today });
      // if (holiday) {
      //   await Attendance.create({
      //     employee: emp._id,
      //     date: today,
      //     status: "Holiday",
      //   });
      //   continue;
      // }

      if (isWeekend) {
        await Attendance.create({
          employee: emp._id,
          date: today,
          status: "Week Off",
        });
        continue;
      }

      // 3. If neither record/holiday/weekend → mark as LOP
      await Attendance.create({
        employee: emp._id,
        date: today,
        status: "LOP",
      });
    }

    console.log("Attendance cron completed ✅");
  } catch (err) {
    console.error("Error running attendance cron:", err);
  }
});
