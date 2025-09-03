// src/helper/populateHelper.js
import mongoose from "mongoose";
import { buildQuery } from "../middlewares/policyEngine.js";

export async function populateHelper(req, res, next) {
  try {
    const { action, model, id } = req.params;
    const { fields, filter } = req.query;
    const user = req.user;
    const body = req.body;

    const queryOrDoc = await buildQuery({
      role: user.role,
      userId: user._id,
      action,
      modelName: model,
      docId: id,
      fields,
      body,
      filter, // ✅ pass filters
    });

    let data;

    if (queryOrDoc instanceof mongoose.Model) {
      data = await queryOrDoc.save();
    } else if (queryOrDoc?.exec && typeof queryOrDoc.exec === "function") {
      data = await queryOrDoc.exec();
    } else {
      data = queryOrDoc;
    }

    const statusCode = action.toLowerCase() === "create" ? 201 : 200;

    if (Array.isArray(data)) {
      res.status(statusCode).json({
        success: true,
        count: data.length,
        data,
      });
    } else {
      res.status(statusCode).json({
        success: true,
        data,
      });
    }
  } catch (error) {
    console.error("populateHelper error:", error);
    next(error);
  }
}
