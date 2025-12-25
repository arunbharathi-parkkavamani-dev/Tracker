// src/helper/populateHelper.js

import { buildQuery } from "../utils/policy/policyEngine.js";
import { parseFilter } from "../utils/filterParser.js";
import queryOptimizer from "../utils/queryOptimizer.js";

export async function populateHelper(req, res, next) {
  try {
    const { action, model, id } = req.params;
    const { type, page = 1, limit = 20, useCache = 'true' } = req.query;
    const user = req.user;

    let { fields, filter, populateFields, sort, ...params } = req.query;

    // Clear cache if requested
    if (useCache === 'false') {
      queryOptimizer.clearCache(model);
    }

    // ------------------------ PAGINATION SETUP ------------------------
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page

    // ------------------------ TYPE-BASED FIELD SELECTION ------------------------
    if (type) {
      const typeNum = parseInt(type);
      if (typeNum === 1) {
        // Summary: minimal fields for performance
        fields = getSummaryFields(model);
        populateFields = getSummaryPopulate(model);
      } else if (typeNum === 2) {
        // Detailed: optimized full fields
        fields = getDetailedFields(model);
        populateFields = getDetailedPopulate(model);
      } else if (typeNum === 3) {
        // Statistics: aggregation for counts/summaries
        return await handleStatistics(req, res, model, user, finalFilter || {});
      }
    }

    // ------------------------ FIELDS NORMALIZATION ------------------------
    if (typeof fields === "string") {
      fields = fields
        .split(",")
        .map(f => f.trim())
        .filter(Boolean);
    }

    // ------------------------ SORT OPTIMIZATION ------------------------
    let sortObj = { createdAt: -1 }; // Default sort
    if (sort) {
      try {
        sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      } catch {
        // Keep default sort if parsing fails
      }
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

    if (typeof filter === "string") {
      let parsed = null;

      // ---------- 1) JSON Mode ----------
      try {
        parsed = JSON.parse(filter);
      } catch {}

      // ---------- 2) Simple Key=Value Mode ----------
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
        finalFilter = parseFilter(filter);
      }
    } else if (filter && typeof filter === "object") {
      finalFilter = filter;
    }

    if (!finalFilter || typeof finalFilter !== "object") {
      finalFilter = {};
    }

    // ------------------------ EXECUTE OPTIMIZED QUERY ------------------------
    let queryFilter = finalFilter;
    
    // For aggregate queries, structure the filter properly
    if (isAggregate && stages) {
      queryFilter = {
        aggregate: true,
        stages: stages
      };
    }
    
    // Handle file upload for create/update actions
    let requestBody = req.body;
    if ((action === 'create' || action === 'update') && req.file) {
      const folder = req.route.path.includes('profile') || req.file.fieldname === 'profileImage' ? 'profile' : 'general';
      const filePath = `documents/${folder}/${req.file.filename}`;
      
      if (req.file.fieldname === 'profileImage' || req.file.fieldname === 'file') {
        requestBody = {
          ...req.body,
          'basicInfo.profileImage': filePath
        };
      } else {
        requestBody = {
          ...req.body,
          filePath: filePath
        };
      }
    }

    // ------------------------ OPTIMIZED QUERY EXECUTION ------------------------
    let data;
    let pagination;

    if (action === 'read' && !id && !isAggregate) {
      // Use optimized pagination for list queries
      const result = await buildOptimizedQuery({
        role: user.role,
        userId: user.id,
        modelName: model,
        fields,
        filter: queryFilter,
        populateFields: populateFields ? JSON.parse(populateFields) : null,
        sort: sortObj,
        page: pageNum,
        limit: limitNum
      });
      
      data = result.data;
      pagination = result.pagination;
    } else {
      // Use regular buildQuery for other operations
      data = await buildQuery({
        role: user.role,
        userId: user.id,
        action,
        modelName: model,
        docId: id,
        fields,
        filter: queryFilter,
        populateFields: populateFields ? JSON.parse(populateFields) : null,
        body: requestBody,
      });
    }

    const statusCode = action === "create" ? 201 : 200;

    const response = {
      success: true,
      count: Array.isArray(data) ? data.length : undefined,
      data,
      type: type ? (parseInt(type) === 1 ? 'summary' : parseInt(type) === 2 ? 'detailed' : 'statistics') : undefined
    };

    // Add pagination info for paginated queries
    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  } catch (error) {
    console.error("populateHelper error:", error.message);
    
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

// Optimized query builder that uses queryOptimizer
async function buildOptimizedQuery(options) {
  const { buildQuery } = await import("../utils/policy/policyEngine.js");
  const { default: models } = await import("../models/Collection.js");
  const { modelName, ...queryOptions } = options;
  
  const Model = models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found`);
  }

  // Apply policy filters first
  let policyFilter;
  try {
    policyFilter = await buildQuery({
      role: options.role,
      userId: options.userId,
      action: 'read',
      modelName: modelName,
      filter: options.filter || {},
      returnFilter: true // Special flag to return just the filter
    });
  } catch (error) {
    // console.warn(`Policy engine error for ${modelName}:`, error.message);
    // Fallback to basic filter if policy fails
    policyFilter = options.filter || {};
  }

  // Use optimized pagination
  return await queryOptimizer.paginatedQuery(Model, {
    filter: policyFilter,
    fields: options.fields,
    populateFields: options.populateFields,
    sort: options.sort,
    page: options.page,
    limit: options.limit,
    useAggregation: options.populateFields && options.populateFields.length > 0
  });
}

// Optimized field selection functions
function getSummaryFields(model) {
  const summaryFields = {
    tasks: ['title', 'status', 'priorityLevel', 'startDate', 'endDate', 'assignedTo', 'clientId', 'createdAt'],
    employees: ['basicInfo.firstName', 'basicInfo.lastName', 'basicInfo.profileImage', 'professionalInfo.designation', 'professionalInfo.department', 'professionalInfo.employeeId'],
    leaves: ['employeeName', 'leaveName', 'startDate', 'endDate', 'status', 'totalDays', 'createdAt'],
    attendances: ['employee', 'date', 'status', 'checkIn', 'checkOut', 'workHours'],
    clients: ['name', 'email', 'contactPerson', 'status', 'createdAt'],
    notifications: ['message', 'read', 'createdAt', 'sender', 'type'],
    todos: ['text', 'completed', 'createdAt', 'priority'],
    dailyactivities: ['employee', 'date', 'activities', 'totalHours', 'createdAt'],
    payrolls: ['employeeId', 'month', 'year', 'netSalary', 'status', 'processedAt'],
    tickets: ['ticketId', 'title', 'category', 'priority', 'status', 'createdBy', 'createdAt'],
    shifts: ['name', 'startTime', 'endTime', 'workingHours', 'isActive'],
    hrpolicies: ['title', 'category', 'status', 'effectiveDate', 'version', 'createdAt']
  };
  return summaryFields[model] || null;
}

function getDetailedFields(model) {
  // For detailed view, we still want to exclude very large fields
  const excludeFields = {
    employees: ['-documents', '-auditLog'],
    tasks: ['-attachments.data'],
    notifications: ['-metadata'],
    clients: ['-documents.data']
  };
  return excludeFields[model] || null;
}

function getSummaryPopulate(model) {
  const summaryPopulate = {
    tasks: [
      { path: 'assignedTo', select: 'basicInfo.firstName basicInfo.lastName basicInfo.profileImage professionalInfo.employeeId' }, 
      { path: 'clientId', select: 'name email' }
    ],
    employees: [
      { path: 'professionalInfo.designation', select: 'name' }, 
      { path: 'professionalInfo.department', select: 'name' }
    ],
    leaves: [
      { path: 'employeeId', select: 'basicInfo.firstName basicInfo.lastName professionalInfo.employeeId' }
    ],
    attendances: [
      { path: 'employee', select: 'basicInfo.firstName basicInfo.lastName professionalInfo.employeeId' }
    ],
    notifications: [
      { path: 'sender', select: 'basicInfo.firstName basicInfo.lastName basicInfo.profileImage' }
    ],
    todos: [
      { path: 'employee', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    dailyactivities: [
      { path: 'employee', select: 'basicInfo.firstName basicInfo.lastName professionalInfo.employeeId' }
    ],
    payrolls: [
      { path: 'employeeId', select: 'basicInfo.firstName basicInfo.lastName professionalInfo.employeeId' },
      { path: 'processedBy', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    tickets: [
      { path: 'createdBy', select: 'basicInfo.firstName basicInfo.lastName' },
      { path: 'assignedTo', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    hrpolicies: [
      { path: 'createdBy', select: 'basicInfo.firstName basicInfo.lastName' },
      { path: 'approvedBy', select: 'basicInfo.firstName basicInfo.lastName' }
    ]
  };
  return JSON.stringify(summaryPopulate[model] || []);
}

function getDetailedPopulate(model) {
  const detailedPopulate = {
    tasks: [
      { path: 'assignedTo', select: '-documents -auditLog' }, 
      { path: 'createdBy', select: 'basicInfo professionalInfo.designation' }, 
      { path: 'clientId', select: '-documents' }
    ],
    employees: [
      { path: 'professionalInfo.designation' }, 
      { path: 'professionalInfo.department' }, 
      { path: 'professionalInfo.role' }, 
      { path: 'professionalInfo.reportingManager', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    leaves: [
      { path: 'employeeId', select: 'basicInfo professionalInfo.designation professionalInfo.department' },
      { path: 'approvedBy', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    attendances: [
      { path: 'employee', select: 'basicInfo professionalInfo.designation professionalInfo.department' },
      { path: 'managerId', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    notifications: [
      { path: 'sender', select: 'basicInfo professionalInfo' },
      { path: 'recipient', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    dailyactivities: [
      { path: 'employee', select: 'basicInfo professionalInfo.designation professionalInfo.department' }
    ],
    payrolls: [
      { path: 'employeeId', select: 'basicInfo professionalInfo' },
      { path: 'processedBy', select: 'basicInfo.firstName basicInfo.lastName' },
      { path: 'approvedBy', select: 'basicInfo.firstName basicInfo.lastName' }
    ],
    tickets: [
      { path: 'createdBy', select: 'basicInfo professionalInfo' },
      { path: 'assignedTo', select: 'basicInfo professionalInfo' },
      { path: 'linkedTaskId', select: 'title status priority' }
    ],
    hrpolicies: [
      { path: 'createdBy', select: 'basicInfo professionalInfo' },
      { path: 'approvedBy', select: 'basicInfo professionalInfo' },
      { path: 'department', select: 'name' }
    ]
  };
  return JSON.stringify(detailedPopulate[model] || []);
}

export default populateHelper;