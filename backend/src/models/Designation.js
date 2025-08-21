// models/Designation.js
const mongoose = require('mongoose');

const DesignationSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    unique: true
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DesignationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Designation', DesignationSchema);