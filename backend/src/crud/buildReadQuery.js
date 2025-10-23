import mongoose from "mongoose";
import models from "../models/Collection.js";
import { getService } from "../utils/servicesCache.js";

/**
 * Build Read Query (Service First + Generic Fallback)
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function buildReadQuery({
  role,
  userId,
  modelName,
  docId,
  filter,
  fields,
}) {
  try {
    // 🧩 Step 1: Check service cache first
    const serviceCache = getService();
    const modelService = serviceCache?.services?.[modelName];

    if (modelService) {
      // Dynamic import of service function
      const serviceModule = await import(modelService);
      if (serviceModule?.read) {
        // Call the service's read method
        return await serviceModule.read({ role, userId, docId, filter, fields });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose read
    const Model =models[modelName] || console.log("No supported Model")

    // Role policy enforcement
    const accessPolicy = serviceCache?.policies?.[modelName]?.read;
    if (accessPolicy && !accessPolicy.includes(role)) {
      throw new Error(`Role "${role}" not authorized to read ${modelName}`);
    }

    // Base query
    let query = docId ? Model.findById(docId) : Model.find(filter || {});

    // Populate fields if requested
    if (fields) {
      const fieldList = fields.split(",").filter(Boolean);
      fieldList.forEach((f) => query.populate(f));
    }

    // Optional role-specific filtering
    if (role === "employee" && modelName === "Attendance") {
      query = query.where("employee").equals(userId);
    }

    // Execute and return
    const results = await query.lean();
    return results;
  } catch (error) {
    console.error(`buildReadQuery(${modelName}) error:`, error.message);
    throw error;
  }
}
