// middleware/policyEngine.js
import models from '../models/Collection.js';
import  {setCache,getPolicy} from '../utils/cache.js';
setCache();

export async function buildQuery({ role, userId, action, modelName, docId, fields, body }) {
  role = role.toLowerCase();
  console.log(models)
  console.log(role, modelName)
  const policies = getPolicy(role);
  console.log(policies[modelName])
  if (!policies || !policies[modelName]) throw new Error('Policy not found');

  const policy = policies[modelName];
  const M = models[modelName];

  let query;

  switch (action.toLowerCase()) {
    case 'read':
      query = docId ? M.findById(docId) : M.find({});

    const fieldArray = fields ? fields.split(',') : [];
    console.log(fieldArray.length)

    // Always apply a projection
    let projection = {};
    // console.log(projection)
    console.log(policy.allowAccess?.read)
    const readAccess = policy.allowAccess?.read;

    console.log(readAccess)

    if (Array.isArray(readAccess) && readAccess.includes('*')) {
      console.log('Allowing all fields for read access');
      const forbidden = policy.forbiddenAccess?.read || [];
      console.log(forbidden)
      forbidden.forEach(f => {
        projection[f] = 0; // exclude
      });
    } else {
      // client requested fields, filter against allow/forbidden
      fieldArray.forEach(f => {
        if (policy.allowAccess?.read === '*' || policy.allowAccess?.read?.includes(f)) {
          if (!policy.forbiddenAccess?.read?.includes(f)) {
            projection[f] = 1;
          }
        }
      });
    }

    query = query.select(projection);

    // isSelf condition check (unchanged)
    const isSelf = docId && String(userId) === String(docId);

    // populate logic (unchanged)
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
      console.log('Creating document');
      console.log(policies[modelName].conditions.create);
      if (modelName.toLowerCase() === 'attendances') {
        const today = new Date();
        today.setHours(0,0,0,0);
        console.log(String(userId));
        console.log(String(body.employee));
        const isSelf = userId ? String(body.employee) == String(userId) : false;
        console.log(isSelf);

        const allowed = policy.conditions.create.some(cond => {
          if (cond.isSelf && isSelf) return true;
          if (cond['!isSelf'] && !isSelf) {
              // for example: must be manager and isLeave
              const isManager = role?.toLowerCase() === 'manager';
              return isManager && body.status === 'Leave';
          }
          return false;
        });
        console.log(allowed);

        if (!allowed) throw new Error('Not allowed to create this record');
        const Holiday = await models['holidays'].findOne({date: today});
        const isHoliday = !!Holiday;
        const isSunday = today.getDay() === 0;
        const lastSaturdayDate = new Date(today);
        lastSaturdayDate.setDate(today.getDate() - 7);
        const lastSaturday = await models['attendances'].findOne({
          employee: userId,
          date: lastSaturdayDate
        });
        const isAlternative = lastSaturday.status === "week off" || lastSaturday.status === "Week off Present";
        const isDeveloper = role?.toLowerCase() === 'developer';

        if(isHoliday || isSunday || (!isAlternative && isDeveloper)){
          body.status ="pending"
        } else{
          if(body.workType.toLowerCase()==="fixed"){
            const checkIn = new Date(body.checkIn);
            const hour = checkIn.getHours();
            const min = checkIn.getMinutes();
            const cutOff = 10*60+20;
            const checkInMinutes = hour * 60 + min;

            if (checkInMinutes > cutOff) {
              body.status = "Late Entry";
            } else{
              body.status = "Present";
            }
          } else if(body.workType.toLowerCase()==="flexible"){
            body.status = "Present"
          }
        }

        const doc = new M({
          ...body,
          employee: body.employee || userId,
          date: today
        });
        query = doc;
      }
      else{
        // default create for other models
        query = new M(body);
      }
      break;

    case 'update':
      if (modelName.toLowerCase() === 'attendances') {
        const today = new Date();
        today.setHours(0,0,0,0);

        const isSelf = userId ? String(body.employee) == String(userId) : false;

        const allowed = policy.conditions.create.some(cond => {
          if (cond.isSelf && isSelf) return true;
          if (cond['!isSelf'] && !isSelf) {
              // for example: must be manager and isLeave
              const isManager = role?.toLowerCase() === 'manager';
              return isManager && body.status === 'Leave';
          }
          return false;
        });
        console.log(allowed);

        if (!allowed) throw new Error('Not allowed to create this record');

        let doc = await M.findOne({
          employee: body.employee || userId,
          date: { $gte: today, $lt: new Date(today.getTime() + 24*60*60*1000) }
        });

        if (!doc) throw new Error('Attendance not found for today');

        // Apply updates only to allowed fields
        Object.assign(doc, body);
        query = doc;

      } else {
        // default update for other models
        query = await M.findById(docId);
        if (!query) throw new Error('Document not found');
        Object.assign(query, body);
      }
      break;


    case 'delete':
      query = M.findById(docId);
      break;

    default:
      throw new Error(`Unsupported action: ${action}`);
  }

  return query;
}
