import Leave from "../models/Leave.js";
import { createAndSendNotification } from "../utils/notificationService.js";
import { generateNotification } from "../middlewares/notificationMessagePrasher.js";


export default  function leaves() {
    return {
        // ---------------- AFTER CREATE ----------------
        afterCreate: async ({ modelName, docId, userId }) => {
            const leavesDoc = await Leave.findById(docId);
            if(!leavesDoc) return;

            const request = {leaveName :leavesDoc.leaveName, leaveReason : leavesDoc.reason};
            const message = generateNotification(
                leavesDoc.employeeName,
                request,
                modelName
            );
            await createAndSendNotification({
                senderId: userId,
                receiverId: leavesDoc.managerId,
                message,
                model: { model: modelName, modelId: leavesDoc._id },
            });
        },
    }
}