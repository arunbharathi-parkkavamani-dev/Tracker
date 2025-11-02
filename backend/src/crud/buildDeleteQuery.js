import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL} from "url";

/**
 * Build Delete Query (Service First + Generic Fallback)
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function buildDeleteQuery({
  role,
  userId,
  modelName,
  docId,
  filter,
}) {
  try {
    // 🧩 Step 1: Try cached service first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];

    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      // Dynamic Import of Service Module
      const serviceModule = await import(fileUrl);
      // The service Default export should return { delete, create, update, read, ... }
      const serviceFactory = serviceModule.default;
      const serviceInstance = serviceFactory();
      const serviceFn = serviceInstance.delete;
      if (typeof serviceFn === "function") {
        return await serviceFn({ role, userId, docId, filter });
      }
    }
    // Role policy enforcement
    return await genericFallback({ role, userId, modelName, docId, filter });

  } catch (error) {
    console.error(`buildDeleteQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

/**
 * 🧩 Generic fallback for Mongoose delete
 */
async function genericFallback({ role, userId, modelName, docId, filter }) {
  try {
    const serviceCache = getAllServices();

    // 🧩 Step 2: Fallback to generic Mongoose delete
    const Model = models[modelName] || console.log(`Unsupported Model ${modelName}`);

    // Role policy enforcement
    const accessPolicy = serviceCache?.policies?.[modelName]?.delete;
    if (accessPolicy && !accessPolicy.includes(role)) {
      throw new Error(`Role "${role}" not authorized to delete ${modelName}`);
    }

    let result;

    if (docId) {
      const doc = await Model.findById(docId);
      if (!doc) throw new Error(`${modelName} document not found`);
      result = await doc.deleteOne();
    } else if (filter) {
      result = await Model.deleteMany(filter);
    } else {
      throw new Error("docId or filter must be provided for delete");
    }

    console.log(`Deleted ${modelName} document(s)`);
    return result;
  } catch (error) {
    console.error(`genericFallback delete(${modelName}) error:`, error.message);
    throw error;
  }
}
