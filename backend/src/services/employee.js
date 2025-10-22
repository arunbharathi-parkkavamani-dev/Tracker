import Employee from "../models/Employee.js";

/**
 * Employee Service — Soft Delete
 * @param {Object} params
 * @returns {Promise<any>}
 */
export default async function employeeService({ model, role, userId, docId }) {
  if (role !== "admin") {
    throw new Error("Only admin can terminate employees");
  }

  if (!docId) {
    throw new Error("Employee ID is required for termination");
  }

  const employee = await Employee.findById(docId);
  if (!employee) throw new Error("Employee not found");

  // Soft delete by updating status
  employee.status = "Terminated";
  await employee.save();

  return { message: "Employee terminated successfully", id: docId };
}
