//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
const cache = new Map()

export async function setCache() {
    try{
        const data = await AccessPolicies.find({}).lean()
        cache.clear();
        data.forEach((policies)=>{
            // Use role ID as string, not toLowerCase since role IDs are ObjectIds
            const role = policies.role.toString();
            if(!cache.has(role)){
                cache.set(role,{})
            }
            const roleCache = cache.get(role);
            roleCache[policies.modelName] = policies;
        });
    }
    catch (error) {
        console.log(error)
    }
}

export function getPolicy (role,modelName){
    try{
        // Use role ID as string, not toLowerCase
        const roleCache = cache.get(role.toString());
        if(!roleCache) {
            console.log(`Role permission not found for role: ${role}`);
            return null;
        }
        if(!modelName) return roleCache;
        const policy = roleCache[modelName];
        if(!policy) {
            console.log(`Model policy not found for role: ${role}, model: ${modelName}`);
            return null;
        }
        return policy;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

export default cache;

