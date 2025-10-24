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
    // 🧩 Step 1: Check service cache first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];
    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);
      const serviceFn = serviceModule.default || serviceModule.create;
      if (serviceFn) {
        return await serviceFn({ role, userId, body });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose create
    const Model = models[modelName] || console.log(`Unsupported Model ${modelName}`)

    // Role policy enforcement
    const accessPolicy = serviceCache?.policies?.[modelName]?.create;
    if (accessPolicy && !accessPolicy.includes(role)) {
      throw new Error(`Role "${role}" not authorized to create ${modelName}`);
    }

    let doc;

    if (Array.isArray(body)) {
      // Bulk insert
      doc = await Model.insertMany(body);
    } else {
      doc = new Model({
        ...body
      });
      await doc.save();
    }

    return doc;
  } catch (error) {
    console.error(`buildCreateQuery(${modelName}) error:`, error.message);
    throw error;
  }
}
