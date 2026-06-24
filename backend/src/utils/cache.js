//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
import Role from "../models/Role.js";
import mongoose from "mongoose";

const cache = new Map();
const roleCapabilityCache = new Map(); // roleId -> Set<capability>
const roleLevelCache = new Map(); // roleId -> level (1-10)
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
        roleLevelCache.clear();
        roles.forEach((r) => {
            roleCapabilityCache.set(r._id.toString(), new Set(r.capabilities || []));
            roleLevelCache.set(r._id.toString(), r.level || 1);
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
        let roleStr = role.toString();
        if (roleStr === 'agent') {
            roleStr = '6a25cbc1cd36294f5e578696';
        }
        const roleCache = cache.get(roleStr);
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
    let roleStr = roleId.toString();
    if (roleStr === 'agent') {
        roleStr = '6a25cbc1cd36294f5e578696';
    }
    return roleCapabilityCache.get(roleStr)?.has(capability) ?? false;
}

/**
 * Get the level (1-10) for a role.
 * Used by dashboard to determine layout variant without hardcoding role names.
 * @param {string} roleId - role ObjectId as string
 * @returns {number} level 1-10, defaults to 1
 */
export function getRoleLevel(roleId) {
    if (!cacheInitialized || !roleId) return 1;
    return roleLevelCache.get(roleId.toString()) || 1;
}

export default cache;
