//  src/utils/cache.js

import AccessPolicies from "../models/AccessPolicies.js";
const cache = new Map()

export async function setCache() {
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
    }
    catch (error) {
        console.log(error)
    }
}

export function getPolicy (role,modelName){
    try{
        console.log(role)
        const roleCache = cache.get(role.toLocaleLowerCase());
        if(!roleCache) return console.log("Role permission not able to find");
        if(!modelName) return roleCache;
        console.log(roleCache)
        return roleCache[modelName] || console.log("model Name is not findable");
    }
    catch (error) {
        console.log(error);
    }
}

export default cache;

