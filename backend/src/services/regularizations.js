// services/regularizations.js
import asyncNotificationService from './asyncNotificationService.js';

export default function regularizations() {
  return {
    // ---------------- Before Create ----------------
    beforeCreate: async ({ body, userId }) => {
      const { default: models } = await import('../models/Collection.js');
      
      // Get employee details
      const employee = await models.employees.findById(userId)
        .populate('professionalInfo.reportingManager')
        .populate('professionalInfo.department');
      
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Set employee details
      body.employeeId = userId;
      body.employeeName = `${employee.basicInfo.firstName} ${employee.basicInfo.lastName}`;
      body.departmentId = employee.professionalInfo.department?._id;
      body.managerId = employee.professionalInfo.reportingManager?._id;
      body.createdBy = userId;
      
      // Validate attendance record exists
      const attendance = await models.attendances.findById(body.attendanceId);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }
      
      // Check if regularization already exists for this attendance
      const existingRegularization = await models.regularizations.findOne({ 
        attendanceId: body.attendanceId 
      });
      if (existingRegularization) {
        throw new Error('Regularization request already exists for this attendance record');
      }
      
      // Set original times from attendance
      body.originalCheckIn = attendance.checkIn;
      body.originalCheckOut = attendance.checkOut;
    },
    
    // ---------------- After Create ----------------
    afterCreate: async ({ docId, userId }) => {
      const { default: models } = await import('../models/Collection.js');
      
      const regularization = await models.regularizations.findById(docId)
        .populate('employeeId', 'basicInfo.firstName basicInfo.lastName')
        .populate('managerId', 'basicInfo.firstName basicInfo.lastName');
      
      if (!regularization || !regularization.managerId) return;
      
      // Notify manager
      await asyncNotificationService.queuePushNotification(
        regularization.managerId._id,
        'Regularization Request',
        `${regularization.employeeName} requested attendance regularization for ${new Date(regularization.requestDate).toLocaleDateString()}`,
        { regularizationId: docId, type: 'regularization_request' }
      );
    },
    
    // ---------------- Before Update ----------------
    beforeUpdate: async ({ body, docId, userId }) => {
      const { default: models } = await import('../models/Collection.js');
      
      body.updatedBy = userId;
      
      // Handle approval/rejection
      if (body.status === 'Approved') {
        body.approvedBy = userId;
        body.approvedAt = new Date();
      } else if (body.status === 'Rejected') {
        body.rejectedBy = userId;
        body.rejectedAt = new Date();
      }
    },
    
    // ---------------- After Update ----------------
    afterUpdate: async ({ docId, body, userId }) => {
      const { default: models } = await import('../models/Collection.js');
      
      if (body.status === 'Approved' || body.status === 'Rejected') {
        const regularization = await models.regularizations.findById(docId)
          .populate('employeeId', 'basicInfo.firstName basicInfo.lastName')
          .populate('approvedBy rejectedBy', 'basicInfo.firstName basicInfo.lastName');
        
        if (!regularization) return;
        
        // Update attendance record if approved
        if (body.status === 'Approved') {
          await models.attendances.findByIdAndUpdate(regularization.attendanceId, {
            checkIn: regularization.requestedCheckIn,
            checkOut: regularization.requestedCheckOut,
            status: 'Present'
          });
        }
        
        // Notify employee
        const actionBy = regularization.approvedBy || regularization.rejectedBy;
        const actionByName = actionBy ? `${actionBy.basicInfo.firstName} ${actionBy.basicInfo.lastName}` : 'Manager';
        
        await asyncNotificationService.queuePushNotification(
          regularization.employeeId._id,
          `Regularization ${body.status}`,
          `Your regularization request for ${new Date(regularization.requestDate).toLocaleDateString()} has been ${body.status.toLowerCase()} by ${actionByName}`,
          { regularizationId: docId, type: 'regularization_response' }
        );
      }
    }
  };
}