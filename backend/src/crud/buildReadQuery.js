import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { pathToFileURL } from "url";
import safeAggregate from "../utils/safeAggregator.js";


/**
 * Build Read Query (Service First + Generic Fallback)
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function buildReadQuery({
  role,
  userId,
  modelName,
  docId,
  filter,
  fields,
}) {
  try {
    // 🧩 Step 1: Try cached service first
    const serviceCache = getAllServices();
    const modelService = serviceCache?.[modelName];

    if (modelService) {
      const fileUrl = pathToFileURL(modelService).href;
      const serviceModule = await import(fileUrl);

      // The service default export should return { create, update, read, ... }
      const serviceFactory = serviceModule.default;
      const serviceInstance = serviceFactory(); 
      const serviceFn = serviceInstance?.read;

      console.log("Loaded model:", modelName);
      console.log("Service read function:", serviceFn?.name || "none");

      if (typeof serviceFn === "function") {
        // ✅ Custom read handler found
        return await serviceFn({ role, userId, docId, filter, fields });
      }
    }

    // 🧩 Step 2: Fallback to generic Mongoose read
    return await genericFallback({ role, userId, modelName, docId, filter, fields });

  } catch (error) {
    console.error(`buildReadQuery(${modelName}) error:`, error.message);
    throw error;
  }
}

/**
 * 🧩 Generic fallback for Mongoose read
 */
/**
 * 🧩 Generic fallback for Mongoose read
 */
async function genericFallback({ role, userId, modelName, docId, filter, fields }) {
  const serviceCache = getAllServices();
  const Model = models[modelName];

  if (!Model) {
    throw new Error(`Unsupported Model: ${modelName}`);
  }

  // 🔒 Role policy enforcement
  const accessPolicy = serviceCache?.policies?.[modelName]?.read;
  if (accessPolicy && !accessPolicy.includes(role)) {
    throw new Error(`Role "${role}" not authorized to read ${modelName}`);
  }

  // ✅ Normalize flat query keys like 'filter[date][$gte]' → { filter: { date: { $gte: ... } } }
  if (filter && Object.keys(filter).length > 0) {
    const parsedFilter = {};
    for (const key in filter) {
      if (key.includes("[")) {
        const path = key.replace(/\]/g, "").split("["); // e.g. ['filter', 'date', '$gte']
        let current = parsedFilter;
        path.forEach((p, idx) => {
          if (idx === path.length - 1) {
            current[p] = filter[key];
          } else {
            current[p] = current[p] || {};
            current = current[p];
          }
        });
      } else {
        parsedFilter[key] = filter[key];
      }
    }

    // Extract the inner "filter" key if present
    filter = parsedFilter.filter || parsedFilter;
  }

  // 🔒 Restrict employees to their own records (for Attendance model)
  if (role === "employee" && modelName === "Attendance") {
    filter.employee = userId;
  }

  // ✅ Auto-convert date range strings to real Date objects
  if (filter?.date) {
    if (filter.date.$gte) {
      filter.date.$gte = new Date(filter.date.$gte);
    }
    if (filter.date.$lte) {
      const end = new Date(filter.date.$lte);
      end.setHours(23, 59, 59, 999); // Include full last day
      filter.date.$lte = end;
    }
  }

  console.log("Filter after processing:", filter);
  if (filter?.aggregate && Array.isArray(filter.stages)) {
    console.log("Using safe aggregation pipeline for filter stages.");

    const matchStage = docId
      ? [{ $match : { _id: Model.schema.Types.ObjectId(docId) } }]
      : filter.matchStage
      ? [{ $match: filter.matchStage }]
      : [];

    const pipeline = [
      ...matchStage,
      ...filter.stages,
      ...(filter.project ? [{ $project: filter.project }] : []),
    ];

    return await safeAggregate(Model, pipeline);
  }

  // 🧩 Build the Mongoose query
  let query = docId ? Model.findById(docId) : Model.find(filter || {});

  // 🧩 Populate fields if requested (comma-separated)
  if (fields) {
    const fieldList = fields.split(",").filter(Boolean);
    fieldList.forEach((f) => query.populate(f));
  }

  console.log("Generic Read Query: ", query.getQuery());
  // 🧩 Execute and return lean results
  const results = await query.lean();
  console.log(`✅ Generic read used for model: ${modelName}`);
  return results;
}