import Attendance from "../models/Attendance.js";
import Notification from "../models/notification.js";

/**
 * Fetch all pending attendance requests for a manager
 */
export const getPendingRequests = async (req, res) => {
  const { managerId, dateFrom, dateTo, type } = req.body;

  if (!managerId)
    return res.status(400).json({ error: "Manager ID is required" });

  try {
    const filter = {
      read: false,
      receiver: managerId,
    };

    if (dateFrom) filter.date = { $gte: new Date(dateFrom) };
    if (dateTo) filter.date = { ...filter.date, $lte: new Date(dateTo) };
    if (type) filter.request = type;

    const pendingRecords = await Notification.find(filter)
      .populate("employee", "name email")
      .sort({ createdAt: -1 });
    res.json({ data: pendingRecords });
  } catch (err) {
    console.error("Failed to fetch pending requests:", err);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};
