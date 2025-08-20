// models/ProjectType.js
const mongoose = require('mongoose');

const ProjectTypeSchema = new mongoose.Schema({
  name: { type: String, trim: true, unique: true }, // e.g., "Web Application"
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProjectType', ProjectTypeSchema);