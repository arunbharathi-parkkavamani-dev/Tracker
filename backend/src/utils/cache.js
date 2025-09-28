//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
const cache = new Map()

export async function setCache(next) {
    try{
        const data = await AccessPolicies.find({}).lean()
        cache.clear();
        data.forEach((policies)=>{
            const role = policies.role.toLocaleLowerCase();
            if(!cache.has(role)){
                cache.set(role,{})
            }
            const roleCache = cache.get(role);
            roleCache[policies.modelName] = policies;
        });
        console.log("policies were initialized for roles:", Array.from(cache.keys()));
    }
    catch (error) {
        next(error)
    }
}

export function getPolicy (role,modelName, next){
    try{
        const roleCache = cache.get(role.toLocaleLowerCase());
        if(!roleCache) return console.log("Role permission not able to find");
        if(!modelName) return roleCache;
        return roleCache[modelName] || console.log("model Name is not findable");
    }
    catch (error) {
        console.log(error);
    }

}

export default cache;

