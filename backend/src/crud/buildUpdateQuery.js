import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";

/**
 * Build Update Query (Service First + Generic Fallback + Lifecycle Hooks)
 */
export default async function buildUpdateQuery({
  role,
  userId,
  modelName,
  docId,
  filter = {},
  body,
  managerId,
  designation
}) {
  try {
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];
    const Model = models[modelName];

    if (!Model) throw new Error(`Invalid model: ${modelName}`);

    let serviceInstance = null;

    // ------------------- Load dynamic service if exists -------------------
    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);
      serviceInstance = serviceModule.default?.();
    }

    // Extract lifecycle functions
    const beforeUpdate = serviceInstance?.beforeUpdate;
    const afterUpdate = serviceInstance?.afterUpdate;

    // ----------------------- BEFORE UPDATE (lifecycle) ----------------------
    if (typeof beforeUpdate === "function") {
      const result = await beforeUpdate({
        role,
        userId,
        body,
        docId,
        managerId,
        designation
      });

      // If result returns mutated body or extra properties, use them
      if (result && typeof result === "object") {
        body = result;
      }
    }

    // ------------------------------ UPDATE OPERATION ------------------------------
    let updatedDoc;

    if (docId) {
      updatedDoc = await Model.findByIdAndUpdate(docId, body, {
        new: true,
        runValidators: true,
      });
    } else {
      updatedDoc = await Model.findOneAndUpdate(filter, body, {
        new: true,
        runValidators: true,
      });
    }

    if (!updatedDoc) throw new Error(`${modelName} not found`);

    // ----------------------- AFTER UPDATE (lifecycle) ----------------------
    if (typeof afterUpdate === "function") {
      await afterUpdate({
        role,
        userId,
        body,
        docId: updatedDoc._id,
        managerId,
        designation,
        modelName
      });
    }

    return updatedDoc;
  } catch (error) {
    console.error(`buildUpdateQuery(${modelName}) error:`, error.message);
    throw error;
  }
}
