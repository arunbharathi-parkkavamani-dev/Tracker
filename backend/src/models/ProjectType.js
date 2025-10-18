// models/ProjectType.js
import { Schema, model } from 'mongoose';

const ProjectTypeSchema = new Schema({
  name: { type: String, trim: true, unique: true }, // e.g., "Web Application"
  description: { type: String }
}, { timestamps: true });

export default model('projecttypes', ProjectTypeSchema);