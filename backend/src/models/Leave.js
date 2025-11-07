import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    departmentName:{ type: String },
    leaveTypeName: { type: String},
    startDate: { type: Date},
    endDate: { type: Date },
    totalDays:{ type: Number},
    reason: {type:String, maxLength :500, minLength: 5, trim: true},
    status:{ type: mongoose.Schema.Types.ObjectId, ref: 'Status'},
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    managerComments: { type: String, maxLength :500, minLength: 5, trim: true },
    approvedAt: { type: Date },
    document :{ type: String },
}, { timestamps: true });

const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export default Leave;
