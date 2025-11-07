import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema({
    name:{type:String, trim:true, unique:true, required:true},
    description:{type:String, maxLength :500, minLength: 5, trim: true},
}, { timestamps: true });

const Status = mongoose.models.Status || mongoose.model('Status', StatusSchema);
export default Status;