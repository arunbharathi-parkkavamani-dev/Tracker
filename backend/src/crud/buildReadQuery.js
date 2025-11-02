import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";

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
    // 🧩 Step 1: Try cached service first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];

    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);

      // The service default export should return { create, update, read, ... }
      const serviceFactory = serviceModule.default;
      const serviceInstance = serviceFactory(); 
      const serviceFn = serviceInstance?.read;

      console.log("Loaded model:", modelName);
      console.log("Service read function:", serviceFn?.name || "none");

      if (typeof serviceFn === "function") {
        // ✅ Custom read handler found
        return await serviceFn({ role, userId, docId, filter, fields });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose read
    return await genericFallback({ role, userId, modelName, docId, filter, fields });

  } catch (error) {
    console.error(`buildReadQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

/**
 * 🧩 Generic fallback for Mongoose read
 */
async function genericFallback({ role, userId, modelName, docId, filter, fields }) {
  const serviceCache = getAllServices();
  const Model = models[modelName];

  if (!Model) {
    throw new Error(`Unsupported Model: ${modelName}`);
  }

  // 🔒 Role policy enforcement
  const accessPolicy = serviceCache?.policies?.[modelName]?.read;
  if (accessPolicy && !accessPolicy.includes(role)) {
    throw new Error(`Role "${role}" not authorized to read ${modelName}`);
  }

  // 🧩 Build query
  let query = docId ? Model.findById(docId) : Model.find(filter || {});

  // 🧩 Populate fields if requested (comma separated)
  if (fields) {
    const fieldList = fields.split(",").filter(Boolean);
    fieldList.forEach((f) => query.populate(f));
  }

  // 🧩 Optional role-based filtering logic
  if (role === "employee" && modelName === "Attendance") {
    query = query.where("employee").equals(userId);
  }

  // 🧩 Execute and return
  const results = await query.lean();
  console.log(`✅ Generic read used for model: ${modelName}`);
  return results;
}