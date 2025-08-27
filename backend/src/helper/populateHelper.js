// src/helper/populateHelper.js
import mongoose from "mongoose";
import { buildQuery } from "../middlewares/policyEngine.js";

export async function populateHelper(req, res, next) {
  try {
    console.log("user hit");
    const { action, model, id } = req.params;
    const { fields } = req.query;
    const user = req.user;
    const body = req.body;

    const queryOrDoc = await buildQuery({
      role: user.role,
      userId: user._id,
      action: action,
      modelName: model,
      docId: id,
      fields: fields,
      body: body,
    });

    let data;

    // Determine if we have a Mongoose Query or a Document
    if (queryOrDoc instanceof mongoose.Model) {
      // It's a document instance → save it
      data = await queryOrDoc.save();
    } else if (queryOrDoc.exec && typeof queryOrDoc.exec === "function") {
      // It's a query → execute it
      data = await queryOrDoc.exec();
    } else {
      // Already a plain document/object
      data = queryOrDoc;
    }

    res.status(201).json({ success: true, data, message: "Fetched updated" });

  } catch (error) {
    next(error);
  }
}
