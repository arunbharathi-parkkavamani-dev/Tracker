// src/middlewares/policyEngine.js
import models from "../models/Collection.js";
import { setCache, getPolicy } from "../utils/cache.js";

setCache();

export async function buildQuery({ role, userId, action, modelName, docId, fields, body, filter }) {
  if (!role || !modelName) throw new Error("Role and modelName are required");

  role = role.toLowerCase();
  const policies = getPolicy(role);
  if (!policies || !policies[modelName]) {
    throw new Error(`Policy not found for role "${role}" on model "${modelName}"`);
  }

  const policy = policies[modelName];
  const M = models[modelName];
  if (!M) throw new Error(`Model "${modelName}" not found`);

  let query;

  switch (action.toLowerCase()) {
    // ---------------- READ ----------------
    case "read": {
  let mongoFilter = {};
  if (filter) {
    const filters = filter.split(";");
    filters.forEach((f) => {
      const [key, value] = f.split(",");
      if (key && value !== undefined) {
        // ✅ enforce policy: key must be in allowed fields
        if (
          policy.allowAccess?.read === "*" ||
          (Array.isArray(policy.allowAccess?.read) &&
            policy.allowAccess.read.includes(key))
        ) {
          mongoFilter[key] = value;
        } else {
          throw new Error(`Filtering by "${key}" is not allowed`);
        }
      }
    });
  }

  query = docId ? M.findById(docId) : M.find(mongoFilter);

  const fieldArray = fields ? fields.split(",") : [];
  let projection = {};

  const readAccess = policy.allowAccess?.read;

  if (Array.isArray(readAccess) && readAccess.includes("*")) {
    const forbidden = policy.forbiddenAccess?.read || [];
    forbidden.forEach((f) => (projection[f] = 0));
  } else if (Array.isArray(readAccess)) {
    if (fieldArray.length > 0) {
      fieldArray.forEach((f) => {
        if (readAccess.includes(f) && !policy.forbiddenAccess?.read?.includes(f)) {
          projection[f] = 1;
        }
      });
    } else {
      readAccess.forEach((f) => {
        if (!policy.forbiddenAccess?.read?.includes(f)) {
          projection[f] = 1;
        }
      });
    }
  }

  query = query.select(projection);

  // ✅ Safe populate
  fieldArray.forEach((f) => {
    policy.conditions?.read?.forEach((cond) => {
      if (cond.isPopulate && f.startsWith(cond.isRef.split(".")[0])) {
        query = query.populate({
          path: cond.isRef,
          select: cond.fields?.join(" "),
          match: { $expr: { $ne: ["$_id", ""] } }, // ignore "" ObjectId values
        });
      }
    });
  });

  break;
}

    // ---------------- CREATE ----------------
    case "create": {
      if (modelName.toLowerCase() === "attendances") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isSelf = userId ? String(body.employee) === String(userId) : false;

        const allowed = policy.conditions.create.some((cond) => {
          if (cond.isSelf && isSelf) return true;
          if (cond["!isSelf"] && !isSelf) {
            const isManager = role === "manager";
            return isManager && body.status === "Leave";
          }
          return false;
        });
        if (!allowed) throw new Error("Not allowed to create this record");

        const Holiday = await models["holidays"].findOne({ date: today });
        const isHoliday = !!Holiday;
        const isSunday = today.getDay() === 0;

        const lastSaturdayDate = new Date(today);
        lastSaturdayDate.setDate(today.getDate() - 7);
        const lastSaturday = await models["attendances"].findOne({
          employee: userId,
          date: lastSaturdayDate,
        });
        const isAlternative =
          lastSaturday?.status === "week off" || lastSaturday?.status === "Week off Present";
        const isDeveloper = role === "developer";

        if (isHoliday || isSunday || (!isAlternative && isDeveloper)) {
          body.status = "Pending";
        } else {
          if (body.workType?.toLowerCase() === "fixed") {
            const checkIn = new Date(body.checkIn);
            const hour = checkIn.getHours();
            const min = checkIn.getMinutes();
            const cutOff = 10 * 60 + 20;
            const checkInMinutes = hour * 60 + min;

            body.status = checkInMinutes > cutOff ? "Late Entry" : "Check-In";
          } else if (body.workType?.toLowerCase() === "flexible") {
            body.status = "Check-In";
          }
        }

        query = new M({
          ...body,
          employee: body.employee || userId,
          date: today,
        });
      } else {
        query = new M(body);
      }
      break;
    }

    // ---------------- UPDATE ----------------
    case "update": {
      if (modelName.toLowerCase() === "attendances") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isSelf = userId ? String(body.employee) === String(userId) : false;
        const allowed = policy.conditions.create.some((cond) => {
          if (cond.isSelf && isSelf) return true;
          if (cond["!isSelf"] && !isSelf) {
            const isManager = role === "manager";
            return isManager && body.status === "Leave";
          }
          return false;
        });
        if (!allowed) throw new Error("Not allowed to update this record");

        const checkInDoc = await models["attendances"].findOne({
          employee: userId,
          date: today,
        });
        if (!checkInDoc) throw new Error("Check-in record not found for today");

        const checkIn = new Date(checkInDoc.checkIn);
        const checkOut = body.checkOut ? new Date(body.checkOut) : null;
        if (!checkOut) throw new Error("Check-out time required");

        const isMale = body.gender === "male";
        const hours = checkOut.getHours();
        const minutes = checkOut.getMinutes();

        const femaleCutOff = 18 * 60 + 30; // 6:30 PM
        const maleCutOff = 19 * 60 + 30;   // 7:30 PM

        const workedMinutes = (checkOut - checkIn) / (1000 * 60);
        const femaleWorkingTime = workedMinutes >= 7.5 * 60;
        const maleWorkingTime = workedMinutes >= 8.5 * 60;

        if (!isMale && (!femaleWorkingTime || (hours * 60 + minutes) < femaleCutOff)) {
          body.status = "Early check-out";
        } else if (isMale && (!maleWorkingTime || (hours * 60 + minutes) < maleCutOff)) {
          body.status = "Early check-out";
        } else {
          body.status = "Check-Out";
        }

        Object.assign(checkInDoc, body);
        query = checkInDoc;
      } else {
        query = await M.findById(docId);
        if (!query) throw new Error("Document not found");
        Object.assign(query, body);
      }
      break;
    }

    // ---------------- DELETE ----------------
    case "delete":
      throw new Error("Delete operation is not allowed");

    // ---------------- UNSUPPORTED ----------------
    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  return query;
}
