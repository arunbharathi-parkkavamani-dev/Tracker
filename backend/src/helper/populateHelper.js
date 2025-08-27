//  src/helper/populateHelper.js

import { buildQuery } from "../middlewares/policyEngine.js";

export async function populateHelper(req, res, next){
    try{
        console.log("user hit")
        const {action, model, id} = req.params;
        const {fields} = req.query;
        const user = req.user;

        const query = await buildQuery({
            role:user.role,
            userId:user._id,
            action: action,
            modelName:model,
            docId:id,
            fields:fields
        });
        let data;
        if(query.exce){
            data = await query.exec();
        } else {
        data = query; // already a document instance
        }
        
        res.status(201).json({ success: true, data, message: "Fetched updated" })
    }
    catch(error){
        next(error)
    }
};

