import models from "../../models/Collection.js";
import { setCache, getPolicy } from "../cache.js";
import { getService } from "../servicesCache.js";
import validator from "../Validator.js";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

setCache();

export async function buildQuery({
  role,
  userId,
  action,
  modelName,
  docId,
  fields,
  body,
  filter
}) {
  if (!role || !modelName) throw new Error("Role and modelName are required");

  const Model = models[modelName];
  if (!Model) throw new Error(`Model "${modelName}" not found`);

  // Load model-specific policy
  const policy = getPolicy(role, modelName);
  if (!policy) throw new Error(`Policy not found for role '${role}' on model '${modelName}'`);

  // --------------------------------------------------
  //  1️⃣ VALIDATE BEFORE CRUD (NO FAIL-OPEN ANYMORE)
  // --------------------------------------------------
  const { filter: safeFilter, fields: safeFields, body: safeBody } = validator({
    action,
    modelName,
    role,
    userId,
    docId,
    filter,
    fields,
    body,
    policy,
    getPolicy        // <-- important for lookup protection
  });

  // --------------------------------------------------
  //  2️⃣ IMPORT THE CORRECT CRUD HANDLER
  // --------------------------------------------------
  const crudFile = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    `../../crud/build${capitalize(action)}Query.js`
  );
  let crudHandler;
  try {
    crudHandler = (await import(pathToFileURL(crudFile).href)).default;
  } catch (err) {
    throw new Error(`❌ CRUD handler not found: ${crudFile}`);
  }

  // --------------------------------------------------
  //  3️⃣ EXECUTE CRUD WITH SAFE DATA ONLY
  // --------------------------------------------------
  return await crudHandler({
    modelName,
    role,
    userId,
    docId,
    fields: safeFields,
    body: safeBody,
    filter: safeFilter,
    policy,
    getService
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
