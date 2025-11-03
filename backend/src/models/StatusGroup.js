import mongoose from "mongoose";

const StatusGroupSchema = new mongoose.Schema({
    groupName: {type:String },
    statusArray : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Status' }],
}, { timestamps: true });

const StatusGroup = mongoose.models.StatusGroup || mongoose.model('StatusGroup', StatusGroupSchema);
export default StatusGroup;