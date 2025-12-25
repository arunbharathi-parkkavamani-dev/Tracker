import mongoose from 'mongoose';

class QueryOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Optimize population to prevent N+1 queries
  optimizePopulation(populateFields, model) {
    if (!populateFields || !Array.isArray(populateFields)) return [];

    return populateFields.map(field => {
      if (typeof field === 'string') {
        return { path: field, select: this.getOptimalFields(field) };
      }
      
      // Add select fields if not specified to reduce data transfer
      if (field.path && !field.select) {
        field.select = this.getOptimalFields(field.path);
      }
      
      return field;
    });
  }

  // Get minimal fields for common references
  getOptimalFields(path) {
    const fieldMap = {
      'employee': 'basicInfo.firstName basicInfo.lastName basicInfo.profileImage',
      'assignedTo': 'basicInfo.firstName basicInfo.lastName basicInfo.profileImage',
      'createdBy': 'basicInfo.firstName basicInfo.lastName',
      'managerId': 'basicInfo.firstName basicInfo.lastName',
      'sender': 'basicInfo.firstName basicInfo.lastName basicInfo.profileImage',
      'receiver': 'basicInfo.firstName basicInfo.lastName',
      'clientId': 'name email contactPerson',
      'departmentId': 'name',
      'designation': 'name',
      'role': 'name permissions'
    };
    
    return fieldMap[path] || '_id name';
  }

  // Build optimized aggregation pipeline
  buildOptimizedPipeline(options) {
    const { filter, fields, populateFields, sort, limit, skip } = options;
    const pipeline = [];

    // Match stage (always first for performance)
    if (filter && Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Lookup stages for population (before project for efficiency)
    if (populateFields && populateFields.length > 0) {
      populateFields.forEach(pop => {
        if (pop.path) {
          pipeline.push({
            $lookup: {
              from: this.getCollectionName(pop.path),
              localField: pop.path,
              foreignField: '_id',
              as: pop.path,
              pipeline: pop.select ? [{ $project: this.parseSelectFields(pop.select) }] : []
            }
          });

          // Unwind if not array reference
          if (!pop.justOne === false) {
            pipeline.push({
              $unwind: {
                path: `$${pop.path}`,
                preserveNullAndEmptyArrays: true
              }
            });
          }
        }
      });
    }

    // Project stage for field selection
    if (fields && fields.length > 0) {
      const projection = {};
      fields.forEach(field => {
        projection[field] = 1;
      });
      pipeline.push({ $project: projection });
    }

    // Sort stage
    if (sort) {
      pipeline.push({ $sort: sort });
    }

    // Pagination stages
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    return pipeline;
  }

  // Parse select fields string to projection object
  parseSelectFields(selectStr) {
    if (!selectStr) return {};
    
    const projection = {};
    selectStr.split(' ').forEach(field => {
      if (field.trim()) {
        projection[field.trim()] = 1;
      }
    });
    return projection;
  }

  // Get collection name from field path
  getCollectionName(path) {
    const collectionMap = {
      'employee': 'employees',
      'assignedTo': 'employees',
      'createdBy': 'employees',
      'managerId': 'employees',
      'sender': 'employees',
      'receiver': 'employees',
      'clientId': 'clients',
      'departmentId': 'departments',
      'designation': 'designations',
      'role': 'roles',
      'leaveTypeId': 'leavetypes'
    };
    
    return collectionMap[path] || path + 's';
  }

  // Optimized pagination with count
  async paginatedQuery(Model, options) {
    const {
      filter = {},
      fields,
      populateFields,
      sort = { createdAt: -1 },
      page = 1,
      limit = 20,
      useAggregation = false
    } = options;

    const skip = (page - 1) * limit;
    const cacheKey = JSON.stringify({ model: Model.modelName, filter, page, limit });

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    let result;

    if (useAggregation || populateFields?.length > 0) {
      // Use aggregation for complex queries
      const pipeline = this.buildOptimizedPipeline({
        filter,
        fields,
        populateFields: this.optimizePopulation(populateFields, Model.modelName),
        sort,
        limit,
        skip
      });

      // Count pipeline (without limit/skip)
      const countPipeline = pipeline.filter(stage => 
        !stage.$limit && !stage.$skip
      );
      countPipeline.push({ $count: 'total' });

      const [data, countResult] = await Promise.all([
        Model.aggregate(pipeline),
        Model.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total || 0;
      
      result = {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } else {
      // Use regular query for simple cases
      const query = Model.find(filter);
      
      if (fields && fields.length > 0) {
        query.select(fields.join(' '));
      }
      
      query.sort(sort).skip(skip).limit(limit);

      const [data, total] = await Promise.all([
        query.lean(), // Use lean() for better performance
        Model.countDocuments(filter)
      ]);

      result = {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    }

    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  // Batch loading to prevent N+1 queries
  async batchLoad(Model, ids, fields) {
    if (!ids || ids.length === 0) return [];
    
    const uniqueIds = [...new Set(ids.map(id => id.toString()))];
    const cacheKey = `batch_${Model.modelName}_${uniqueIds.join(',')}_${fields?.join(',')}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const query = Model.find({ _id: { $in: uniqueIds } });
    
    if (fields && fields.length > 0) {
      query.select(fields.join(' '));
    }
    
    const results = await query.lean();
    
    // Create lookup map for O(1) access
    const resultMap = new Map();
    results.forEach(doc => {
      resultMap.set(doc._id.toString(), doc);
    });
    
    // Return results in original order
    const orderedResults = ids.map(id => resultMap.get(id.toString()) || null);
    
    this.cache.set(cacheKey, {
      data: orderedResults,
      timestamp: Date.now()
    });
    
    return orderedResults;
  }

  // Clear cache
  clearCache(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new QueryOptimizer();