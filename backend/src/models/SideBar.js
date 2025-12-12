// src/Models/SideBar.js
import mongoose from "mongoose";

const IconSchema = new mongoose.Schema({
  iconName: { type: String },
  iconPackage: { type: String }
}, { _id: false });   // No need timestamps or _id for subdocument

const SideBarSchema = new mongoose.Schema({
  title: { type: String, trim: true, index: true },    // frequent search & filtering
  icon: IconSchema,
  
  mainRoute: { 
    type: String, 
    trim: true, 
    required: true, 
    unique: true, 
    index: true 
  },

  routes: [{
    type: String,
    index: true   // improves lookup for nested URL blocking
  }],

  order: { type: Number, default: 0, index: true },  // fast sorting
  isActive: { type: Boolean, default: true, index: true },

}, { timestamps: true });

// Compound index for active+sorting queries (commonly used in dashboards)
SideBarSchema.index({ isActive: 1, order: 1 });

export default mongoose.model("sidebars", SideBarSchema);
