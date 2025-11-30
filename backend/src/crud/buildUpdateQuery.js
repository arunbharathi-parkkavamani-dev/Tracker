// src/crud/buildUpdateQuery.js
import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { getPolicy } from "../utils/cache.js";
import { pathToFileURL } from "url";
import sanitizeUpdate from "../utils/sanitizeUpdate.js";
import validateFieldUpdateRules from "../utils/validateFieldUpdateRules.js";
import runRegistry from "../utils/registryExecutor.js";
import { saveAuditLog } from "../utils/auditLogger.js";

export default async function buildUpdateQuery({
  role,
  userId,
  modelName,
  docId,
  filter = {},
  body,
  policy
}) {
  const Model = models[modelName];
  if (!Model) throw new Error(`Invalid model: ${modelName}`);

  /** -----------------------------------------------
   * 1) UPDATE PERMISSION CHECK
   * ----------------------------------------------- */
  if (!policy?.permissions?.update) {
    throw new Error(`⛔ Role "${role}" has no UPDATE permission on "${modelName}"`);
  }

  /** -----------------------------------------------
   * 2) CLEAN BODY (no unauthorized fields)
   * ----------------------------------------------- */
  body = sanitizeUpdate({ body, policy });

  /** -----------------------------------------------
   * 3) Prevent critical field update bypasses
   * ----------------------------------------------- */
  validateFieldUpdateRules({ body, modelName, role, userId });

  /** -----------------------------------------------
   * 4) Registry (ABAC — isSelf, custom logic)
   * ----------------------------------------------- */
  const registryOutput = await runRegistry({
    role,
    userId,
    modelName,
    action: "update",
    policy
  });

  if (registryOutput?.body) body = registryOutput.body;
  if (registryOutput?.filter) filter = registryOutput.filter;

  /** -----------------------------------------------
   * 5) Lifecycle injection — BEFORE UPDATE
   * ----------------------------------------------- */
  const serviceCache = getAllServices();
  const modelService = serviceCache?.[modelName];
  let serviceInstance = null;

  if (modelService) {
    const fileUrl = pathToFileURL(modelService).href;
    const serviceModule = await import(fileUrl);
    serviceInstance = serviceModule.default?.();
  }

  const beforeUpdate = serviceInstance?.beforeUpdate;
  const afterUpdate = serviceInstance?.afterUpdate;

  if (typeof beforeUpdate === "function") {
    const result = await beforeUpdate({ role, userId, docId, body, filter });
    if (result && typeof result === "object") body = result;
  }

  // BEFORE writing: keep snapshot for audit
  const beforeDoc = docId
    ? await Model.findById(docId).lean()
    : await Model.findOne(filter).lean();


  /** -----------------------------------------------
   * 6) EXECUTE UPDATE — PARTIAL UPDATE (PATCH) SAFE
   * ----------------------------------------------- */
  let updatedDoc;

  if (docId) {
    updatedDoc = await Model.findByIdAndUpdate(docId, { $set: body }, {
      new: true,
      runValidators: true
    });
  } else {
    updatedDoc = await Model.findOneAndUpdate(filter, { $set: body }, {
      new: true,
      runValidators: true
    });
  }

  if (!updatedDoc) throw new Error(`${modelName} not found`);

  // Convert before passing to afterUpdate + audit
  const cleanDoc = updatedDoc.toObject();


  /** -----------------------------------------------
   * 7) Lifecycle — AFTER UPDATE
   * ----------------------------------------------- */
  if (typeof afterUpdate === "function") {
    await afterUpdate({
      role,
      userId,
      docId: updatedDoc._id,
      data: cleanDoc,
      body
    });
  }

  await saveAuditLog({
    action: "update",
    modelName,
    userId,
    role,
    docId: updatedDoc._id,
    beforeDoc,
    afterDoc: cleanDoc,
  });

  return cleanDoc;
}
