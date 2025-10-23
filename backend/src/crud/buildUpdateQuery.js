import models from "../models/Collection.js";
import { getService } from "../utils/servicesCache.js";

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
    const serviceCache = getService();
    const modelService = serviceCache?.services?.[modelName];

    if (modelService) {
      const serviceModule = await import(modelService);
      if (serviceModule?.update) {
        return await serviceModule.update({ role, userId, docId, filter, body });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose update
    const Model = models[modelName] || console.log(`Unsupported Model ${modelName}`)

    // Role policy enforcement
    const accessPolicy = serviceCache?.policies?.[modelName]?.update;
    if (accessPolicy && !accessPolicy.includes(role)) {
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
