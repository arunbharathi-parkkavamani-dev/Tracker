// models/Client.js
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, trim: true, unique: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  contactPerson: { type: String },
  projectTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectType' }] // ✅ updated
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);