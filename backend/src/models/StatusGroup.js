import mongoose from "mongoose";

const StatusGroupSchema = new mongoose.Schema({
    groupName: {type:String },
    statusArray : [{
        StatusDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
        orderKey : {type:Number}
    }],
}, { timestamps: true });

StatusGroupSchema.index(
  {
    groupName: 1,
    "statusArray.StatusDetails": 1,
    "statusArray.orderKey": 1,
  },
  { unique: true, sparse: true }
);

const StatusGroup = mongoose.models.StatusGroup || mongoose.model('StatusGroup', StatusGroupSchema);
export default StatusGroup;