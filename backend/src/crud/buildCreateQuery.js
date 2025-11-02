import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";

/**
 * Build Create Query (Service First + Generic Fallback)
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function buildCreateQuery({
  role,
  userId,
  modelName,
  body,
}) {
  try {
    // 🧩 Step 1: Try cached service first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];

    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);
      const serviceFactory = serviceModule.default;
      const serviceInstance = serviceFactory(); // expected to return { create, update, ... }
      const serviceFn = serviceInstance.create;

      console.log("Loaded model:", modelName);
      console.log("Service function:", serviceFn?.name || "none");

      if (typeof serviceFn === "function") {
        // ✅ Use service create
        return await serviceFn({ role, userId, body });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose create
    return await genericFallback({ modelName, body, role });

  } catch (error) {
    console.error(`buildCreateQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

/**
 * 🧩 Generic fallback create operation
 */
async function genericFallback({ modelName, body, role }) {
  const serviceCache = getAllServices();
  const Model = models[modelName];

  if (!Model) {
    throw new Error(`Unsupported Model: ${modelName}`);
  }

  // 🔒 Role policy enforcement
  const accessPolicy = serviceCache?.policies?.[modelName]?.create;
  if (accessPolicy && !accessPolicy.includes(role)) {
    throw new Error(`Role "${role}" not authorized to create ${modelName}`);
  }

  let doc;
  if (Array.isArray(body)) {
    doc = await Model.insertMany(body);
  } else {
    doc = new Model(body);
    await doc.save();
  }

  console.log(`✅ Generic fallback used for model: ${modelName}`);
  return doc;
}
