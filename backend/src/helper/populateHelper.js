import { buildQuery } from "../middlewares/policyEngine.js";

export async function populateHelper(req, res, next) {
  try {
    const { action, model, id } = req.params;
    const user = req.user;
    
    // Extract and normalize query parameters
    let { fields, filter, ...extraQuery } = req.query;
    if(req.body) {

      const { params = {}, ...bodyData } = req.body;
      
      // Merge everything into a single filter
      filter = filter || {};
      filter = {
        ...params,
        ...bodyData,
      };
    }

    // Merge everything into a single filter
      filter = filter || {};
      filter = {
        ...filter,
        ...extraQuery,
      };

      console.log(filter);
    

    // Main buildQuery call
    const data = await buildQuery({
      role: user.role,
      userId: user.id,
      action,
      modelName: model,
      docId: id,
      fields,
      body: req.body,
      filter,
    });

    // Response handling
    const statusCode = action === "create" ? 201 : 200;

    return res.status(statusCode).json({
      success: true,
      count: Array.isArray(data) ? data.length : undefined,
      data,
    });
  } catch (error) {
    console.error("populateHelper error:", error.message);
    next(error);
  }
}
