import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  capabilities: [{
    type: String, required: true, unique: true
  }]
});

const Role = mongoose.model("roles", roleSchema);

export default Role;