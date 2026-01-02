// src/Models/SideBar.js
import mongoose from "mongoose";

const IconSchema = new mongoose.Schema({
  iconName: { type: String },
  iconPackage: { type: String }
}, { _id: false });

const SideBarSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  icon: IconSchema,
  
  mainRoute: { 
    type: String, 
    trim: true, 
    required: true, 
    unique: true,  
  },

  routes: [{
    type: String,
  }],

  // Parent-child structure
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'sidebars', default: null },
  hasChildren: { type: Boolean, default: false },
  isParent: { type: Boolean, default: false },

  order: { type: Number, default: 0},
  isActive: { type: Boolean, default: true},

}, { timestamps: true });

// Compound index for active+sorting queries
SideBarSchema.index({ isActive: 1, order: 1 });
SideBarSchema.index({ parentId: 1, order: 1 });
SideBarSchema.index({ isParent: 1, hasChildren: 1 });

export default mongoose.model("sidebars", SideBarSchema);
