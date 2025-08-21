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
  projectTypes: [{ type: Schema.Types.ObjectId, ref: 'ProjectType' }] // ✅ updated
}, { timestamps: true });

export default model('Client', ClientSchema);