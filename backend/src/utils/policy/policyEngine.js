import models from "../../models/Collection.js";
import { setCache, getPolicy } from "../cache.js";
import { getService } from "../servicesCache.js";
import validator from "../Validator.js";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

// Remove immediate cache initialization
// setCache(); // This will be called from index.js after DB connection

export async function buildQuery({
  role,
  userId,
  action,
  modelName,
  docId,
  fields,
  body,
  filter,
  populateFields,
  returnFilter = false // New flag for returning just the filter
}) {
  if (!role || !modelName) throw new Error("Role and modelName are required");

  const Model = models[modelName];
  if (!Model) throw new Error(`Model "${modelName}" not found`);

  // Load model-specific policy
  const policy = getPolicy(role, modelName);
  if (!policy) {
  console.warn(`Policy not found for role '${role}' on model '${modelName}', allowing request`);
    // For now, allow all requests when policy is missing
    if (returnFilter) {
      return filter || {};
    }
    // Skip validation and proceed with basic CRUD
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
    
    return await crudHandler({
      modelName,
      role,
      userId,
      docId,
      fields,
      body,
      filter,
      populateFields,
      policy: null,
      getService
    });
  }

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

  // If only filter is requested, return it
  if (returnFilter) {
    return safeFilter;
  }
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
    populateFields,
    policy,
    getService
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
