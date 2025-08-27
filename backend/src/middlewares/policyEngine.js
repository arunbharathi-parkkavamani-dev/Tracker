// middleware/policyEngine.js
import models from '../models/Collection.js';
import  {setCache,getPolicy} from '../utils/cache.js';
setCache();

export async function buildQuery({ role, userId, action, modelName, docId, fields }) {
  let isSelf = false
  if (userId === docId) isSelf=true
  role = role.toLowerCase();
  console.log(role,modelName)
  const policies = getPolicy(role);
  console.log(policies)
  if (!policies || !policies[modelName]) throw new Error('Policy not found');

  const policy = policies[modelName];
  const M = models[modelName];

  let query;

  switch (action.toLowerCase()) {
    case 'read':
    // Base query
    query = docId ? M.findById(docId) : M.find({});

    // Split fields even if undefined for safe use
    const fieldArray = fields ? fields.split(',') : [];

    // Apply field selection from allowed/forbidden access
    if (fieldArray.length) {
      const projection = {};
      fieldArray.forEach(f => {
        if (policy.allowAccess?.read === '*' || !policy.forbiddenAccess?.read?.includes(f)) {
          projection[f] = 1;
        }
      });
      query = query.select(Object.keys(projection).join(' '));
    }

    // Determine if this is a self query
    const isSelf = docId && String(userId) === String(docId);

    // Apply populate only if requested field matches a condition with isPopulate
    fieldArray.forEach(f => {
      policy.conditions?.read?.forEach(cond => {
        if (cond.isPopulate && f.startsWith(cond.isRef.split('.')[0])) {
          query = query.populate({
            path: cond.isRef,
            select: cond.fields?.join(' ')
          });
        }
      });
    });
    break;


    case 'create':
      query = new M(); // Data insertion will be filtered in router based on allowed fields
      break;

    case 'update':
      query = M.findById(docId); // Updates applied in router on allowed fields
      break;

    case 'delete':
      query = M.findById(docId);
      break;

    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  return query;
}
