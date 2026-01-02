import mongoose from 'mongoose';

const MileStoneSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'clients', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'projects', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true },
    createdAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    completedAt: { type: Date }
});

MileStoneSchema.index({clientId: 1});
MileStoneSchema.index({clientId: 1, projectId: 1});

const milestones = mongoose.models.milestones || mongoose.model('milestones', MileStoneSchema); 

export default milestones;