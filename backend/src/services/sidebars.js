import models from "../models/Collection.js";
import { getPolicy } from "../utils/cache.js";

// Map sidebar routes to model names for permission checking
const ROUTE_MODEL_MAP = {
    '/dashboard': null, // Always allowed if authenticated
    '/tickets': 'tickets',
    '/tasks': 'tasks',
    '/attendance': 'attendances',
    '/leaves': 'leaves',
    '/employees': 'employees',
    '/clients': 'clients',
    '/calendar': null,
    '/settings': null,
    '/daily-tracker': 'dailyactivities',
    '/me': 'employees',
    '/salary-expense': 'payrolls', // Checking payrolls permission for salary view
    '/travel-expenses': 'expenses',
    '/users': 'employees',
    '/roles': 'roles',
    '/holidays': 'holidays',
    '/assets': 'assets',
    '/master-data': null // Usually a parent menu, filtered by children
};

export default function () {
    return {
        /**
         * Before Read: Filter by Department and Designation (Schema level filtering)
         * This handles the "allow" lists defined in the Sidebar document itself.
         */
        beforeRead: async ({ role, userId, filter }) => {
            const user = await models.employees.findById(userId)
                .select('professionalInfo.department professionalInfo.designation')
                .lean();

            if (!user) return { filter };

            const userDept = user.professionalInfo?.department;
            const userDesig = user.professionalInfo?.designation;

            // Apply OR logic: 
            // 1. Allowed Dept is empty (everyone) OR User's Dept is in list
            // 2. Allowed Desig is empty (everyone) OR User's Desig is in list
            const deptFilter = {
                $or: [
                    { allowedDepartments: { $size: 0 } },
                    { allowedDepartments: { $exists: false } },
                    { allowedDepartments: userDept }
                ]
            };

            const desigFilter = {
                $or: [
                    { allowedDesignations: { $size: 0 } },
                    { allowedDesignations: { $exists: false } }, // Handle legacy data
                    { allowedDesignations: userDesig }
                ]
            };

            // Combine with existing filter
            return {
                filter: {
                    ...filter,
                    $and: [
                        ...(filter.$and || []),
                        deptFilter,
                        desigFilter
                    ]
                }
            };
        },

        /**
         * After Read: Filter by Role-based Access Policy
         * This hides items where the user does not have 'Read' permission for the underlying model.
         */
        afterRead: async ({ role, userId, data }) => {
            if (!data) return data;

            // If data is a single object, wrap it for consistent processing, but remember to unwrap
            const isArray = Array.isArray(data);
            let items = isArray ? data : [data];

            try {
                // Get User's Access Policy
                // Note: 'getPolicy' helper might fetch from cache or DB using the name. 
                // We need the full policy document.

                // Assuming we can fetch policy permissions easily. 
                // If getPolicy returns true/false for a model/action, we iterate.

                // Optimization: Pre-fetch permissions for relevant models if possible 
                // or assume we have efficient cache lookup.

                items = items.filter(item => {
                    // 1. Check if parent/child structure logic handles itself? 
                    // Usually we filter children first, then if parent has no children and is not a link, hide parent?
                    // For now, strict route filtering.

                    if (!item.mainRoute) return true; // Keep items without route (separators, etc)

                    // Normalize route to get model key
                    // e.g. '/tickets/new' -> check '/tickets'
                    // Simple check: Exact match first, then startsWith

                    let modelName = ROUTE_MODEL_MAP[item.mainRoute];

                    if (!modelName) {
                        // Inherit or guess?
                        // If no mapping, we assume it's a generic page (dashboard, etc.) and allow it
                        // UNLESS explicitly forbidden in the future.
                        return true;
                    }

                    // Check Policy
                    // We need to know if Role has READ access to modelName
                    const policy = getPolicy(role, modelName);

                    // If policy exists and read is FALSE, hide it.
                    // If policy doesn't exist (default deny? or default allow?), 
                    // standard behavior in this system seems to be Default Deny if strictly enforced,
                    // but for Sidebar visualization, we might be lenient if no policy is defined.
                    // BUT 'buildReadQuery' throws if no policy. So we should probably hide it.

                    if (policy && policy.permissions && policy.permissions.read === false) {
                        return false;
                    }

                    return true;
                });

                // Extra Polish: Filter out parents that have no children left (if they are just containers)
                // This would require a tree traversal which might be expensive here if the list is flat.
                // Assuming the frontend handles "Empty Groups", or the list is hierarchical.
                // The current populateHelper output seems to be the list as stored (flat or hierarchy?).
                // SideBar model has parentId. PopulateHelper typically returns lean docs.

                return isArray ? items : items[0];

            } catch (err) {
                console.error("Error in SideBarService afterRead:", err);
                return data; // Fail safe: return original data
            }
        }
    };
}
