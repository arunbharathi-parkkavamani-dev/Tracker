// src/Models/SideBar.js
import mongoose from "mongoose";

const IconSchema = new mongoose.Schema({
  iconName: { type: String },
  iconPackage: { type: String }
}, { timestamps: true });

const SideBarSchema = new mongoose.Schema({
  title: { type: String, trim: true },        // e.g., "Dashboard"
  icon: IconSchema,                           // embedded sub document
  route: { type: String, trim: true },        // e.g., "/dashboard"
  roles: [{ type: String }]                   // roles who can see this
}, { timestamps: true });

export default mongoose.model("sidebars", SideBarSchema);