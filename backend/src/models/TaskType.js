import mongoose from "mongoose";

const TaskTypeScheme = new mongoose.Schema({
    name: { type: String, trim:true},
    description: { type: String, trim:true}
}, {timestamps:true});

export default mongoose.model('TaskType', TaskTypeScheme);