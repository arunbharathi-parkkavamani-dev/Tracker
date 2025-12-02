/**
 * Registry: isSelf
 * Checks if the current user is accessing their own record
 */
export default function isSelf(user, record, context = {}) {
  if (!user || !record) return false;
  
  // Direct ID match
  if (record._id && user.id === record._id.toString()) {
    return true;
  }
  
  // Employee ID match for attendance, leaves, daily activities
  if (record.employeeId && user.id === record.employeeId.toString()) {
    return true;
  }
  
  // User ID match for various models
  if (record.userId && user.id === record.userId.toString()) {
    return true;
  }
  
  // Created by match
  if (record.createdBy && user.id === record.createdBy.toString()) {
    return true;
  }
  
  return false;
}