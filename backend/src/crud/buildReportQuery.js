import models from "../models/Collection.js";

export default async function buildReportQuery({
  modelName,
  role,
  userId,
  filter = {},
  fields,
  populateFields,
  body = {},
  policy,
  getService
}) {
  const Model = models[modelName];
  if (!Model) throw new Error(`Model "${modelName}" not found`);

  try {
    const pipeline = [];

    // Match stage (filter)
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Date range filter
    if (body.dateRange) {
      const { startDate, endDate, dateField = 'createdAt' } = body.dateRange;
      const matchStage = {};
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        matchStage[dateField] = dateFilter;
        pipeline.push({ $match: matchStage });
      }
    }

    // Handle type-based responses
    const type = body.type || 'summary'; // summary or details

    if (type === 'summary' && body.groupBy) {
      // Handle subGroupBy for nested grouping
      if (body.subGroupBy) {
        // First group by main field and subfield
        pipeline.push({
          $group: {
            _id: {
              main: `$${body.groupBy}`,
              sub: `$${body.subGroupBy}`
            },
            count: { $sum: 1 }
          }
        });

        // Then group by main field and create sub counts
        const groupStage = {
          _id: '$_id.main',
          total: { $sum: '$count' }
        };

        // Create dynamic fields for each sub group value
        pipeline.push({
          $group: {
            ...groupStage,
            subGroups: {
              $push: {
                key: '$_id.sub',
                count: '$count'
              }
            }
          }
        });

        // Convert subGroups array to object fields
        pipeline.push({
          $addFields: {
            subGroupsObj: {
              $arrayToObject: {
                $map: {
                  input: '$subGroups',
                  as: 'item',
                  in: {
                    k: '$$item.key',
                    v: '$$item.count'
                  }
                }
              }
            }
          }
        });

        // Merge subGroupsObj fields into root
        pipeline.push({
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                { _id: '$_id', total: '$total' },
                '$subGroupsObj'
              ]
            }
          }
        });

      } else {
        // Simple groupBy without subGroupBy
        const groupStage = {
          _id: `$${body.groupBy}`,
          count: { $sum: 1 }
        };

        // Add sum operations if specified
        if (body.sum) {
          if (Array.isArray(body.sum)) {
            body.sum.forEach(field => {
              groupStage[field] = { $sum: `$${field}` };
            });
          } else {
            groupStage[body.sum] = { $sum: `$${body.sum}` };
          }
        }

        pipeline.push({ $group: groupStage });
      }

      // Add lookup for populated field names
      if (populateFields && populateFields.includes(body.groupBy)) {
        const lookupModel = getModelForField(body.groupBy);
        if (lookupModel) {
          pipeline.push({
            $lookup: {
              from: lookupModel.toLowerCase() + 's',
              localField: '_id',
              foreignField: '_id',
              as: 'groupData'
            }
          });
          pipeline.push({
            $project: {
              _id: 1,
              count: 1,
              name: { $arrayElemAt: ['$groupData.name', 0] },
              ...Object.keys(groupStage).filter(k => k !== '_id' && k !== 'count').reduce((acc, k) => {
                acc[k] = 1;
                return acc;
              }, {})
            }
          });
        }
      }

      // Sort by count descending
      pipeline.push({ $sort: { count: -1 } });

    } else if (type === 'details') {
      // Return detailed records with population
      if (populateFields) {
        populateFields.forEach(field => {
          const lookupModel = getModelForField(field);
          if (lookupModel) {
            pipeline.push({
              $lookup: {
                from: lookupModel.toLowerCase() + 's',
                localField: field,
                foreignField: '_id',
                as: field + 'Data'
              }
            });
          }
        });
      }

      // Field selection
      if (fields) {
        const projection = {};
        fields.split(' ').forEach(field => {
          projection[field] = 1;
        });
        pipeline.push({ $project: projection });
      }
    }

    // Apply sorting
    if (body.sort) {
      pipeline.push({ $sort: body.sort });
    }

    // Apply limit
    if (body.limit) {
      pipeline.push({ $limit: body.limit });
    }

    // Apply skip for pagination
    if (body.skip) {
      pipeline.push({ $skip: body.skip });
    }

    const result = await Model.aggregate(pipeline);
    return result;

  } catch (error) {
    throw new Error(`Report query failed: ${error.message}`);
  }
}

// Helper function to get model name for field
function getModelForField(field) {
  const fieldModelMap = {
    'employee': 'employees',
    'user': 'employees', 
    'assignedTo': 'employees',
    'createdBy': 'employees',
    'client': 'clients',
    'department': 'departments',
    'role': 'roles',
    'leaveType': 'leavetypes'
  };
  return fieldModelMap[field];
}