//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
import mongoose from "mongoose";

const cache = new Map()
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

        const data = await AccessPolicies.find({}).lean()
        cache.clear();
        data.forEach((policies) => {
            // Use role ID as string, not toLowerCase since role IDs are ObjectIds
            const role = policies.role.toString();
            if (!cache.has(role)) {
                cache.set(role, {})
            }
            const roleCache = cache.get(role);
            roleCache[policies.modelName] = policies;
        });
        cacheInitialized = true;
    }
    catch (error) {
        // console.log('Cache initialization error:', error.message)
    }
}

export function getPolicy(role, modelName) {
    try {
        // Check if cache is initialized
        if (!cacheInitialized) {
            // console.log('Cache not initialized yet, returning null');
            return null;
        }

        // Use role ID as string, not toLowerCase
        const roleCache = cache.get(role.toString());
        if (!roleCache) {
            // console.log(`Role permission not found for role: ${role}`);
            return null;
        }
        if (!modelName) return roleCache;
        const policy = roleCache[modelName];
        if (!policy) {
            // console.log(`Model policy not found for role: ${role}, model: ${modelName}`);
            return null;
        }
        return policy;
    }
    catch (error) {
        // console.log(error);
        return null;
    }
}

export default cache;

