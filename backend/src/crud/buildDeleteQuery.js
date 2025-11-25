// src/crud/buildDeleteQuery.js
import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { getPolicy } from "../utils/cache.js";
import { pathToFileURL } from "url";
import runRegistry from "../utils/registryExecutor.js";
import {saveAuditLog } from "../utils/auditLogger.js"

export default async function buildDeleteQuery({
  role,
  userId,
  modelName,
  docId,
  filter = {},
  policy
}) {
  const Model = models[modelName];
  if (!Model) throw new Error(`Invalid model: ${modelName}`);

  /** -----------------------------------------------
   * 1) DELETE PERMISSION CHECK
   * ----------------------------------------------- */
  if (!policy?.permissions?.delete) {
    throw new Error(`⛔ Role "${role}" has no DELETE permission on "${modelName}"`);
  }

  /** -----------------------------------------------
   * 2) Registry (must ALSO allow delete — rule #3)
   * ----------------------------------------------- */
  const registryOutput = await runRegistry({
    role,
    userId,
    modelName,
    action: "delete",
    policy
  });

  if (registryOutput?.filter) {
    filter = registryOutput.filter;
  }

  /** -----------------------------------------------
   * 3) Lifecycle service loading
   * ----------------------------------------------- */
  const serviceCache = getAllServices();
  const modelService = serviceCache?.[modelName];
  let serviceInstance = null;

  if (modelService) {
    const fileUrl = pathToFileURL(modelService).href;
    const serviceModule = await import(fileUrl);
    serviceInstance = serviceModule.default?.();
  }

  const beforeDelete = serviceInstance?.beforeDelete;
  const afterDelete  = serviceInstance?.afterDelete;

  /** -----------------------------------------------
   * 4) BEFORE DELETE lifecycle hook
   * ----------------------------------------------- */
  if (typeof beforeDelete === "function") {
    await beforeDelete({ role, userId, docId, filter, modelName });
  }

  const beforeDoc = await Model.findById(docId).lean();

  /** -----------------------------------------------
   * 5) SOFT DELETE OPERATION (UPDATE NOT REMOVE)
   * ----------------------------------------------- */
  let updateQuery = {
    deleted: true,
    deletedAt: new Date(),
    deletedBy: userId
  };

  let deletedDoc;

  if (docId) {
    deletedDoc = await Model.findByIdAndUpdate(
      docId,
      { $set: updateQuery },
      { new: true }
    );
  } else {
    deletedDoc = await Model.findOneAndUpdate(
      filter,
      { $set: updateQuery },
      { new: true }
    );
  }

  if (!deletedDoc) throw new Error(`${modelName} not found for delete`);

  /** -----------------------------------------------
   * 6) AFTER DELETE lifecycle hook
   * ----------------------------------------------- */
  if (typeof afterDelete === "function") {
    await afterDelete({
      role,
      userId,
      docId: deletedDoc._id,
      modelName,
      deletedDoc
    });
  }

  await saveAuditLog({
    action: "delete",
    modelName,
    userId,
    role,
    docId: deletedDoc._id,
    beforeDoc,
    afterDoc: deletedDoc,
    ip: null
  });

  return deletedDoc;
}
