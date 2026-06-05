import * as payrollEngine from './payrollEngine.js';
import { canDo } from '../utils/cache.js';

const FROZEN_FIELDS = [
  'grossSalary', 'netSalary', 'earnedBreakdown', 'deductionBreakdown',
  'lopDays', 'salaryStructureId', 'processedBy', 'processedAt', 'workingDays',
  'presentDays', 'overtimePay'
];
const VALID_TRANSITIONS = { Processed: ['Approved'], Approved: ['Paid'] };

export default function payrolls() {
  return {
    async beforeCreate({ role, userId, body }) {
      if (!canDo(role, 'manage:payroll')) throw new Error('Only HR and Admins can create payroll records.');

      const { employeeId, month, year } = body;
      if (!employeeId || !month || !year) throw new Error('employeeId, month, and year are required.');

      const result = await payrollEngine.runPayrollForEmployee(
        employeeId, Number(month), Number(year), userId, body.payrollRunId || null
      );

      // Return the fully computed body — all client-sent salary values are discarded
      return {
        employeeId,
        month: Number(month),
        year:  Number(year),
        salaryStructureId:  result.salaryStructureId,
        payrollRunId:       body.payrollRunId || null,
        workingDays:        result.workingDays,
        presentDays:        result.presentDays,
        leaveDays:          result.leaveDays,
        lopDays:            result.lopDays,
        overtimeHours:      result.overtimeHours,
        overtimePay:        result.overtimePay,
        earnedBreakdown:    result.earnedBreakdown,
        deductionBreakdown: result.deductionBreakdown,
        grossSalary:        result.grossSalary,
        netSalary:          result.netSalary,
        status:             'Processed',
        processedBy:        userId,
        processedAt:        new Date()
      };
    },

    async beforeUpdate({ role, userId, docId, body, existingDoc }) {
      if (!canDo(role, 'manage:payroll')) throw new Error('Only HR and Admins can update payroll records.');

      if (!existingDoc) {
        const { default: Payroll } = await import('../models/Payroll.js');
        existingDoc = await Payroll.findById(docId).lean();
      }
      if (!existingDoc) throw new Error('Payroll record not found.');

      // Immutability gate — frozen after Approved
      if (['Approved', 'Paid'].includes(existingDoc.status)) {
        const attemptedFrozen = Object.keys(body).filter(k => k !== 'status');
        if (attemptedFrozen.length > 0 || body.status === existingDoc.status) {
          if (!(existingDoc.status === 'Approved' && body.status === 'Paid')) {
            throw new Error(`Payroll record is frozen after ${existingDoc.status}. Only Approved→Paid transition is allowed.`);
          }
        }
      }

      // Block direct salary field mutation at any status
      for (const f of FROZEN_FIELDS) {
        if (body[f] !== undefined) throw new Error(`Field "${f}" cannot be updated directly.`);
      }

      // Validate status transition
      if (body.status) {
        const allowed = VALID_TRANSITIONS[existingDoc.status] || [];
        if (!allowed.includes(body.status)) {
          throw new Error(`Invalid status transition: ${existingDoc.status} → ${body.status}`);
        }
        if (body.status === 'Approved') {
          body.approvedBy = userId;
          body.approvedAt = new Date();
          body.frozenAt   = new Date();
        }
        if (body.status === 'Paid') {
          body.paidAt = new Date();
        }
      }

      return body;
    }
  };
}
