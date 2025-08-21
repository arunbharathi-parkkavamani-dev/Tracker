// helpers/populateHelper.js
import models from "../models/collection.js";
import { canRead, canUpdate, canDelete } from "../utils/accessCheck.js";

export async function handlePopulate(req, res, next) {
  try {
    const { action, model, id } = req.params;
    const { fields, key, customFun, limit } = req.query;

    const M = models[model];
    if (!M) return res.status(400).json({ error: `Unknown model: ${model}` });

    const role = req.user.role;
    let result;

    switch (action.toLowerCase()) {
      case "create": {
        const data = {};
        Object.keys(req.body).forEach((f) => {
          if (canUpdate(role, model, f, req.user, null)) {
            data[f] = req.body[f];
          }
        });
        result = await M.create(data);
        break;
      }

      case "read": {
      // If reading single doc
      if (id) {
        const targetDoc = await M.findById(id).lean();
        if (!targetDoc) return res.status(404).json({ error: "Not found" });

        // Check if self is required
        if (role === "Employee" && String(req.user._id) !== String(targetDoc._id)) {
          return res.status(403).json({ error: "Not authorized to view other employees" });
        }

        // Field projection
        if (fields) {
          const fieldList = fields.split(",");
          const allowed = fieldList.filter((f) =>
            canRead(role, model, f, req.user, targetDoc)
          );

          const projection = {};
          allowed.forEach((f) => (projection[f] = 1));

          let query = M.findById(id, projection).lean();

          if (key && model === "Employee")
            query.populate({
              path: key,
              select:
                "basicInfo.firstName basicInfo.phone professionalInfo.empId professionalInfo.role",
            });
          if (key) query.populate(key);

          result = await query.exec();
        } else {
          result = targetDoc;
        }
      } else {
        // Multiple docs (list)
        let query = M.find({});
        const maxLimit = Math.min(parseInt(limit) || 50, 100);
        query = query.limit(maxLimit).lean();
        result = await query.exec();
      }

      if (customFun && typeof M[customFun] === "function") {
        result = await M[customFun](result, req);
      }
      break;
    }


      case "update": {
        const updateData = {};
        Object.keys(req.body).forEach((f) => {
          if (canUpdate(role, model, f, req.user, null)) {
            updateData[f] = req.body[f];
          }
        });
        result = await M.findByIdAndUpdate(id, updateData, { new: true });
        break;
      }

      case "delete": {
        const doc = await M.findById(id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        if (!canDelete(role, model, req.user, doc)) {
          return res.status(403).json({ error: "Not authorized" });
        }
        result = await M.findByIdAndDelete(id);
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported action: ${action}` });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}