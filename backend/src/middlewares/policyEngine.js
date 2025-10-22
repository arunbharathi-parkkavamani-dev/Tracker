import models from "../models/Collection.js";
import { getPolicy } from "../utils/cache.js";
import { getService } from "../utils/servicesCache.js";

export async function buildQuery({ role, userId, action, modelName, docId, fields, body, filter }) {
  if (!role || !modelName) throw new Error("Role and modelName are required");

  const model = models[modelName];
  if (!model) throw new Error(`Model "${modelName}" not found`);

  // Get role-based policy
  const policy = getPolicy(role, modelName);
  if (!policy) throw new Error(`Policy not found for ${role} on ${modelName}`);

  // Dynamically import CRUD builder based on action
  const crudFile = `../crud/build${capitalize(action)}Query.js`;
  let crudHandler;
  try {
    crudHandler = (await import(crudFile)).default;
  } catch (err) {
    throw new Error(`Unsupported action "${action}"`);
  }

  // Execute CRUD logic
  const result = await crudHandler({
    model,
    role,
    userId,
    docId,
    fields,
    body,
    filter,
    policy,
    getService,
  });

  return result;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
