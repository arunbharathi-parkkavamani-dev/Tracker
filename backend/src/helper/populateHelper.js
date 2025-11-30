// src/helper/populateHelper.js

import { buildQuery } from "../utils/policy/policyEngine.js";
import { parseFilter } from "../utils/filterParser.js";

export async function populateHelper(req, res, next) {
  try {
    const { action, model, id } = req.params;
    const user = req.user;

    let { fields, filter, populateFields, ...params } = req.query;

    // ------------------------ FIELDS NORMALIZATION ------------------------
    if (typeof fields === "string") {
      fields = fields
        .split(",")
        .map(f => f.trim())
        .filter(Boolean);
    }

    // ------------------------ AGGREGATE MODE ------------------------
    const isAggregate = params.aggregate === "true" || params.aggregate === true;

    let stages;
    if (params.stages) {
      try {
        stages =
          typeof params.stages === "string"
            ? JSON.parse(params.stages)
            : params.stages;
      } catch {
        stages = undefined;
      }
    }

    // ------------------------ FILTER NORMALIZATION ------------------------
    let finalFilter = null;

    if (!isAggregate) {
      if (typeof filter === "string") {
        let parsed = null;

        // ---------- 1) JSON Mode ----------
        // ex: {"receiver":"123","read":false}
        try {
          parsed = JSON.parse(filter);
        } catch {}

        // ---------- 2) Simple Key=Value Mode ----------
        // Only allowed when filter has NO spaces and NO logical operators
        const isSimple =
          !filter.includes(" ") &&
          !filter.includes("&&") &&
          !filter.includes("||") &&
          !filter.includes("(") &&
          !filter.includes(")");

        if (!parsed && isSimple && filter.includes("=")) {
          const [k, v] = filter.split("=");
          parsed = { [k.trim()]: v.trim() };
        }

        // ---------- 3) Expression Mode ----------
        if (parsed && typeof parsed === "object") {
          finalFilter = parsed;
        } else {
          // ex: (employee = 123 && date >= 2025-01-01 && status != Reject)
          finalFilter = parseFilter(filter);
        }
      }

      // ---------- Already an object from frontend ----------
      else if (filter && typeof filter === "object") {
        finalFilter = filter;
      }

      // ---------- Final Safety ----------
      if (!finalFilter || typeof finalFilter !== "object") {
        finalFilter = {};
      }
    }

    // ------------------------ EXECUTE MAIN QUERY ------------------------
    const data = await buildQuery({
      role: user.role,
      userId: user.id,
      action,
      modelName: model,
      docId: id,
      fields,
      filter: finalFilter,
      aggregate: isAggregate,
      stages,
      populateFields: populateFields ? JSON.parse(populateFields) : null,
      body: req.body,
    });

    const statusCode = action === "create" ? 201 : 200;

    return res.status(statusCode).json({
      success: true,
      count: Array.isArray(data) ? data.length : undefined,
      data,
    });
  } catch (error) {
    console.error("populateHelper error:", error.message);
    
    // Enhanced error response
    const statusCode = error.status || 500;
    const errorResponse = {
      success: false,
      message: error.message || "Internal server error",
      action: req.params?.action,
      model: req.params?.model,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
    
    return res.status(statusCode).json(errorResponse);
  }
}
