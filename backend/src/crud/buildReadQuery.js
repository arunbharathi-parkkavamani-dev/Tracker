// src/crud/buildReadQuery.js
import models from "../models/Collection.js";
import { getAllServices } from "../utils/servicesCache.js";
import { getPolicy } from "../utils/cache.js";
import { pathToFileURL } from "url";
import { buildMongoFilter } from "../utils/mongoFilterCompiler.js";


import runRegistry from "../utils/registryExecutor.js";
import sanitizeRead from "../utils/sanitizeRead.js";
import sanitizePopulated from "../utils/sanitizePopulated.js";
import safeAggregate from "../utils/safeAggregator.js";
import mongoose from "mongoose";

export default async function buildReadQuery({
  role,
  userId,
  modelName,
  docId,
  filter,
  fields,
  populateFields,
  policy
}) {

  const Model = models[modelName];
  if (!Model) throw new Error(`Model "${modelName}" not found`);

  /** -----------------------------------------------
   * 1) CRUD READ PERMISSION
   * ----------------------------------------------- */
  if (!policy?.permissions?.read) {
    throw new Error(`Role "${role}" has no READ permission on model "${modelName}"`);
  }

  /** -----------------------------------------------
   * 2) Field sanitization (allowed + forbidden)
   * ----------------------------------------------- */
  if (fields) console.log("[buildReadQuery.js:35] Before sanitizeRead - fields:", fields);
  fields = sanitizeRead({ fields, policy }); // returns an array like ["basicInfo.firstName"]
  if (fields) console.log("[buildReadQuery.js:37] After sanitizeRead - fields:", fields);

  /** -----------------------------------------------
   * 3) Registry execution (populateRef, isSelf, custom)
   * ----------------------------------------------- */
  const registryOutput = await runRegistry({
    role,
    userId,
    modelName,
    action: "read",
    policy
  });

  // registry may override direct read control
  fields = registryOutput?.fields ?? fields;
  filter = registryOutput?.filter ?? filter;


  /** -----------------------------------------------
   * 4) beforeRead hook (service)
   * ----------------------------------------------- */
  const serviceCache = getAllServices();
  const modelService = serviceCache?.[modelName];
  let serviceInstance = null;

  if (modelService) {
    const fileUrl = pathToFileURL(modelService).href;
    const serviceModule = await import(fileUrl);
    serviceInstance = serviceModule.default?.();

    if (typeof serviceInstance?.beforeRead === "function") {
      const hook = await serviceInstance.beforeRead({ role, userId, docId, filter, fields });
      if (hook?.filter) filter = hook.filter;
      if (hook?.fields) fields = hook.fields;
    }
  }

  /** ============================================================
   *  🔥 5) AGGREGATE READ — With `$lookup` policy enforcement
   * ============================================================ */
  if (filter?.aggregate === true && Array.isArray(filter.stages)) {
    // Enforce permission for every $lookup
    for (const stage of filter.stages) {
      if (stage.$lookup?.from) {
        const targetModel = Object.keys(models).find(
          m => models[m].collection.collectionName === stage.$lookup.from
        );

        if (!targetModel) continue; // lookup alias, skip

        const targetPolicy = getPolicy(role, targetModel);
        if (!targetPolicy || !targetPolicy.permissions?.read) {
          throw new Error(
            `❌ Role "${role}" is NOT allowed to READ $lookup model "${targetModel}" inside aggregate`
          );
        }
      }
    }

    const matchStage = docId && docId.trim() && docId !== "" && mongoose.Types.ObjectId.isValid(docId)
      ? [{ $match: { _id: new mongoose.Types.ObjectId(docId) } }]
      : filter.matchStage
        ? [{ $match: filter.matchStage }]
        : [];

    const pipeline = [
      ...matchStage,
      ...filter.stages,
      ...(filter.project ? [{ $project: filter.project }] : [])
    ];

    let result = await safeAggregate(Model, pipeline);

    if (serviceInstance?.afterRead) {
      result = await serviceInstance.afterRead({ role, userId, docId, data: result });
    }

    return result;
  }

  /** -----------------------------------------------
   * 6) STANDARD READ QUERY
   * ----------------------------------------------- */


  const mongoFilter = buildMongoFilter(filter);
  
  let query = docId && docId.trim() && docId !== "" && mongoose.Types.ObjectId.isValid(docId)
    ? Model.findById(new mongoose.Types.ObjectId(docId))
    : Model.find(mongoFilter || {});

  if (fields) console.log("[buildReadQuery.js:115] Fields to select:", fields);

  // 🔒 base document projection + populate
  if (Array.isArray(fields) && fields.length > 0 && !fields.includes("*")) {
    // Populate only explicitly requested fields
    fields.forEach(f => {
      const raw = typeof f === "string" ? f : String(f);
      const path = raw.replace(/[^\w.]/g, ""); // remove quotes, brackets
      const schemaPath =
        Model.schema.path(`${path}.$`) ||
        Model.schema.path(path);
      
      if (schemaPath?.options?.ref) {
        const selectFields = populateFields?.[path] || 'name';
        query.populate({ path, select: selectFields });
      }
    });
  }

  // ❗ populate first, then lean
  let result = await query.lean();
  
  // Handle populate manually to avoid cast errors
  if (result) {
    const docs = Array.isArray(result) ? result : [result];
    
    for (const doc of docs) {
      // Ensure professionalInfo exists
      if (!doc.professionalInfo) {
        doc.professionalInfo = {};
      }
      
      // Manually populate designation if it exists and is valid
      if (doc.professionalInfo?.designation && 
          mongoose.Types.ObjectId.isValid(doc.professionalInfo.designation)) {
        try {
          const designation = await models.designations.findById(doc.professionalInfo.designation).lean();
          doc.professionalInfo.designation = designation;
        } catch (e) {
          doc.professionalInfo.designation = null;
        }
      } else {
        doc.professionalInfo.designation = null;
      }
      
      // Manually populate other refs similarly
      const refFields = ['department', 'role', 'reportingManager'];
      for (const field of refFields) {
        if (doc.professionalInfo?.[field] && 
            mongoose.Types.ObjectId.isValid(doc.professionalInfo[field])) {
          try {
            const refModel = field === 'reportingManager' ? 'employees' : `${field}s`;
            const refDoc = await models[refModel]?.findById(doc.professionalInfo[field]).lean();
            doc.professionalInfo[field] = refDoc;
          } catch (e) {
            doc.professionalInfo[field] = null;
          }
        } else {
          doc.professionalInfo[field] = null;
        }
      }
    }
    
    result = Array.isArray(result) ? docs : docs[0];
  }
  if (docId && result) result = [result]; // unify with list format for sanitization

  /** -----------------------------------------------
   * 7) Populate sanitization (populateRef mode)
   * ----------------------------------------------- */
  if (registryOutput?.isPopulationContext) {
    result = sanitizePopulated({
      results: result,
      allowedFields: registryOutput.allowedPopulateFields,
      modelName
    });
  }

  /** -----------------------------------------------
   * 8) afterRead hook
   * ----------------------------------------------- */
  if (serviceInstance?.afterRead) {
    result = await serviceInstance.afterRead({ role, userId, docId, data: result });
  }

  return docId ? result?.[0] : result;
}
