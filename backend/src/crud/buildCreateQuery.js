// src/crud/buildCreateQuery.js
import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { getPolicy } from "../utils/cache.js";
import { pathToFileURL } from "url";
import sanitizeWrite from "../utils/sanitizeWrite.js";
import runRegistry from "../utils/registryExecutor.js";

export default async function buildCreateQuery({
  role,
  userId,
  modelName,
  body,
  policy
}) {
  const Model = models[modelName];
  if (!Model) throw new Error(`Model "${modelName}" not found`);

  /** -----------------------------------------------
   * 1) CREATE PERMISSION CHECK
   * ----------------------------------------------- */
  if (!policy?.permissions?.create) {
    throw new Error(`⛔ Role "${role}" has no CREATE permission on "${modelName}"`);
  }

  /** -----------------------------------------------
   * 2) Sanitize Write Body (remove forbidden fields)
   * ----------------------------------------------- */
  body = sanitizeWrite({ body, policy, action: "create" }); // applies allowAccess + forbiddenAccess

  /** -----------------------------------------------
   * 3) Registry rules (ABAC: isSelf, custom)
   * ----------------------------------------------- */
  const registryOutput = await runRegistry({
    role,
    userId,
    modelName,
    action: "create",
    policy
  });

  // registry override
  if (registryOutput?.body) {
    body = registryOutput.body;
  }

  /** -----------------------------------------------
   * 4) Service Logic (Lifecycle Hooks)
   * ----------------------------------------------- */
  const serviceCache = getAllServices();
  const modelService = serviceCache?.[modelName];
  let serviceInstance = null;

  if (modelService) {
    const fileUrl = pathToFileURL(modelService).href;
    const serviceModule = await import(fileUrl);
    serviceInstance = serviceModule.default?.();
  }

  const beforeCreate = serviceInstance?.beforeCreate;
  const afterCreate  = serviceInstance?.afterCreate;

  // beforeCreate may mutate and return new body
  if (typeof beforeCreate === "function") {
    const result = await beforeCreate({ role, userId, body });
    if (result && typeof result === "object") body = result;
  }

  /** -----------------------------------------------
   * 5) Create Record (Bulk or Single)
   * ----------------------------------------------- */
  let createdDocument;
  if (Array.isArray(body)) {
    createdDocument = await Model.insertMany(body);
  } else {
    const doc = new Model(body);
    createdDocument = await doc.save();
  }

  /** -----------------------------------------------
   * 6) afterCreate Lifecycle Hook
   * ----------------------------------------------- */
  if (typeof afterCreate === "function") {
    await afterCreate({
      role,
      userId,
      modelName,
      docId: Array.isArray(createdDocument)
        ? createdDocument.map(doc => doc._id.toString())
        : createdDocument._id.toString()
    });
  }

  return createdDocument;
}
