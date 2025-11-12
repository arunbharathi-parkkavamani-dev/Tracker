import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";

/**
 * Build Update Query (Service First + Generic Fallback)
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function buildUpdateQuery({
  role,
  userId,
  modelName,
  docId,
  filter,
  body,
}) {
  try {
    // 🧩 Step 1: Check service cache first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];

    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);
      const serviceFactory = serviceModule.default;
      const serviceInstance = serviceFactory();
      const serviceFn = serviceInstance.update;
      if (typeof serviceFn === "function") {
        return await serviceFn({ role, userId, body, docId, filter });
      }
    }
    return await genericFallback({ role, userId, modelName, docId, filter, body });
  } catch (error) {
    console.error(`buildUpdateQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

export async function genericFallback({ role, userId, modelName, docId, filter, body }) {
  try {
    // 🧩 Step 2: Fallback to generic Mongoose update
    const serviceCache = getAllServices();
    const Model = models[modelName] || console.log(`Unsupported Model ${modelName}`);

    // Role policy enforcement
    const accessPolicy = serviceCache?.policies?.[modelName]?.update;
    if (accessPolicy && !accessPolicy.includes(role, userId)) {
      throw new Error(`Role "${role}" not authorized to update ${modelName}`);
    }

    let doc;

    if (docId) {
      doc = await Model.findById(docId);
      if (!doc) throw new Error(`${modelName} document not found`);
      Object.assign(doc, body);
      await doc.save();
    } else if (filter) {
      doc = await Model.updateMany(filter, { $set: body });
    } else {
      throw new Error("docId or filter must be provided for update");
    }

    return doc;
  } catch (error) {
    console.error(`buildUpdateQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

