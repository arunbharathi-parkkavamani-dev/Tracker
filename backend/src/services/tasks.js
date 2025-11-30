import Task from "../models/Tasks.js";
import CommentsThread from "../models/CommentsThreads.js";
import Employee from "../models/Employee.js";
import { sendNotification } from "../utils/notificationService.js";
import { generateNotification } from "../middlewares/notificationMessagePrasher.js";

export default function tasks() {
  return {
    // ======================================================
    // BEFORE CREATE
    // ======================================================
    beforeCreate: async ({ body, userId }) => {
      // creator should always be a follower
      body.followers = Array.from(new Set([...(body.followers || []), userId]));
    },

    // ======================================================
    // AFTER CREATE
    // ======================================================
    afterCreate: async ({ modelName, docId, userId }) => {
      const taskDoc = await Task.findById(docId).populate("createdBy", "name");
      if (!taskDoc) return;

      const creatorName = taskDoc.createdBy?.name || "User";

      // initial comment thread + auto comment
      const thread = await CommentsThread.create({
        taskId: taskDoc._id,
        comments: [
          {
            commentedBy: userId,
            message: `task created by ${creatorName}`
          }
        ]
      });

      taskDoc.commentsThread = thread._id;
      await taskDoc.save();

      // notify assigned users
      if (taskDoc.assignedTo?.length) {
        const assignedUsers = new Set(taskDoc.assignedTo.map(String));
        for (const receiverId of assignedUsers) {
          if (receiverId === userId.toString()) continue;
          const message = generateNotification(
            creatorName,
            { type: "assigned" },
            modelName
          );
          await sendNotification({
            recipient: receiverId,
            sender: userId,
            type: 'task_assignment',
            title: 'Task Assignment',
            message,
            relatedModel: modelName,
            relatedId: docId,
          });
        }
      }
    },

    // ======================================================
    // BEFORE UPDATE
    // ======================================================
    beforeUpdate: async ({ body, docId }) => {
      const oldDoc = await Task.findById(docId).lean();
      if (!oldDoc) return;
      body._oldStatus = oldDoc.status;
      body._oldAssignedTo = oldDoc.assignedTo || [];
    },

    // ======================================================
    // AFTER UPDATE
    // ======================================================
    afterUpdate: async ({ modelName, userId, docId, body }) => {
      const taskDoc = await Task.findById(docId).populate("createdBy", "name");
      if (!taskDoc) return;

      const updater = await Employee.findById(userId).select("name");
      const updaterName = updater?.name || "User";

      const oldStatus = body._oldStatus;
      const newStatus = taskDoc.status;

      const oldAssigned = (body._oldAssignedTo || []).map(String);
      const newAssigned = (taskDoc.assignedTo || []).map(String);

      // --------------------------------------------------------
      // 🟢 COMMENT ADDED (add comment to thread + notify)
      // --------------------------------------------------------
      if (body._isComment) {
        const commentText = body._commentText || "";
        const mentioned = (body._mentionedUserIds || []).map(String);

        // insert comment into CommentsThread
        await CommentsThread.updateOne(
          { _id: taskDoc.commentsThread },
          {
            $push: {
              comments: {
                commentedBy: userId,
                message: commentText,
                mentions: mentioned,
              },
            },
          }
        );

        // notify assigned + followers + mentioned
        const notifyUsers = new Set([
          ...newAssigned,
          ...(taskDoc.followers || []).map(String),
          ...mentioned,
        ]);

        for (const receiverId of notifyUsers) {
          if (receiverId === userId.toString()) continue;

          const message = generateNotification(
            updaterName,
            {
              type: "comment",
              isMention: mentioned.includes(receiverId),
              comment: commentText,
            },
            modelName
          );

          await sendNotification({
            recipient: receiverId,
            sender: userId,
            type: 'task_comment',
            title: 'Task Comment',
            message,
            relatedModel: modelName,
            relatedId: docId,
          });
        }

        return;
      }

      // --------------------------------------------------------
      // 🔵 STATUS CHANGE
      // --------------------------------------------------------
      if (oldStatus !== newStatus) {
        const notifyUsers = new Set([
          ...newAssigned,
          ...(taskDoc.followers || []).map(String)
        ]);

        for (const receiverId of notifyUsers) {
          if (receiverId === userId.toString()) continue;

          const message = generateNotification(
            updaterName,
            { type: "status", oldStatus, newStatus },
            modelName
          );

          await sendNotification({
            recipient: receiverId,
            sender: userId,
            type: 'task_status',
            title: 'Task Status Update',
            message,
            relatedModel: modelName,
            relatedId: docId,
          });
        }
      }

      // --------------------------------------------------------
      // 🟣 NEW ASSIGNEES
      // --------------------------------------------------------
      const addedAssignees = newAssigned.filter(id => !oldAssigned.includes(id));
      if (addedAssignees.length) {
        for (const receiverId of addedAssignees) {
          if (receiverId === userId.toString()) continue;
          const message = generateNotification(
            updaterName,
            { type: "assigned" },
            modelName
          );
          await sendNotification({
            recipient: receiverId,
            sender: userId,
            type: 'task_assignment',
            title: 'New Task Assignment',
            message,
            relatedModel: modelName,
            relatedId: docId,
          });
        }
      }

      // auto follow new assignees
      const followersSet = new Set((taskDoc.followers || []).map(String));
      for (const id of newAssigned) {
        if (!followersSet.has(id)) taskDoc.followers.push(id);
      }
      await taskDoc.save();
    }
  };
}