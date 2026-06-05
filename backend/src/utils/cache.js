//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
import Role from "../models/Role.js";
import mongoose from "mongoose";

const cache = new Map();
const roleCapabilityCache = new Map(); // roleId -> Set<capability>
let cacheInitialized = false;


export async function setCache() {
    try {
        // Wait for database connection
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                if (mongoose.connection.readyState === 1) {
                    resolve();
                } else {
                    mongoose.connection.once('connected', resolve);
                }
            });
        }

        const [policies, roles] = await Promise.all([
            AccessPolicies.find({}).lean(),
            Role.find({ isActive: true }).lean(),
        ]);

        cache.clear();
        policies.forEach((p) => {
            const role = p.role.toString();
            if (!cache.has(role)) cache.set(role, {});
            cache.get(role)[p.modelName] = p;
        });

        roleCapabilityCache.clear();
        roles.forEach((r) => {
            roleCapabilityCache.set(r._id.toString(), new Set(r.capabilities || []));
        });

        cacheInitialized = true;
    }
    catch (error) {
        // console.log('Cache initialization error:', error.message)
    }
}

export function getPolicy(role, modelName) {
    try {
        if (!cacheInitialized) return null;
        const roleCache = cache.get(role.toString());
        if (!roleCache) return null;
        if (!modelName) return roleCache;
        return roleCache[modelName] || null;
    } catch { return null; }
}

/**
 * Check if a role (by ObjectId string) has a given capability.
 * @param {string} roleId  - req.user.role (ObjectId as string)
 * @param {string} capability - e.g. 'manage:salarystructures'
 */
export function canDo(roleId, capability) {
    if (!cacheInitialized || !roleId) return false;
    return roleCapabilityCache.get(roleId.toString())?.has(capability) ?? false;
}

export default cache;

