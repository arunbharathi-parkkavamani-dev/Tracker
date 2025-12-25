// models/Client.js
import { Schema, model } from 'mongoose';

const ClientSchema = new Schema({
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
  projectTypes: [{ type: Schema.Types.ObjectId, ref: 'projecttypes' }] // ✅ updated
}, { timestamps: true });

// Indexes for optimal filtering
ClientSchema.index({ name: 1 });
ClientSchema.index({ email: 1 });
ClientSchema.index({ createdAt: -1 });

export default model('clients', ClientSchema);