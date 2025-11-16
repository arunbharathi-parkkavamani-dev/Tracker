import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";

/**
 * Build Create Query (Service First + Generic Fallback with Lifecycle)
 */
export default async function buildCreateQuery({
  role,
  userId,
  modelName,
  body,
  managerId,
  designation,
}) {
  try {
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];
    const Model = models[modelName];

    if (!Model) return message("Invalid Model")

    let serviceInstance = null;

    // ---------------- Try dynamic service ----------------
    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);
      serviceInstance = serviceModule.default?.();
    }

    // Extract lifecycle functions (if available)
    const beforeCreate = serviceInstance?.beforeCreate;
    const afterCreate = serviceInstance?.afterCreate;

    // -------------------------------- BEFORE CREATE --------------------------------
    if (typeof beforeCreate === "function") {
      const result = await beforeCreate({
        role,
        userId,
        body,
        managerId,
        designation,
      });

      // If beforeCreate returns mutated body, use it
      if (result && typeof result === "object") body = result;
    }

    // ----------------------------- CREATE OPERATION ---------------------------------
    let createdDocument;

    if (Array.isArray(body)) {
      // Array bulk insert
      createdDocument = await Model.insertMany(body);
    } else {
      const doc = new Model(body);
      createdDocument = await doc.save();
    }


    // -------------------------------- AFTER CREATE ---------------------------------
    if (typeof afterCreate === "function") {
      await afterCreate({
        userId,
        docId: createdDocument._id,
        modelName
      });
    }

    // Final return
    return createdDocument;
  } catch (err) {
    console.error(`buildCreateQuery(${modelName}) error:`, err.message);
    throw err;
  }
}
