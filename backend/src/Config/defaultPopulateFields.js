// Default fields to populate for each model when no specific fields are requested
export const DEFAULT_POPULATE_FIELDS = {
  employees: {
    'professionalInfo.designation': 'title',
    'professionalInfo.department': 'name', 
    'professionalInfo.role': 'name',
    'professionalInfo.reportingManager': 'basicInfo.firstName,basicInfo.lastName'
  },
  departments: {
    'head': 'basicInfo.firstName,basicInfo.lastName'
  },
  designations: {
    'department': 'name'
  },
  leaves: {
    'employee': 'basicInfo.firstName,basicInfo.lastName',
    'leaveType': 'name',
    'approvedBy': 'basicInfo.firstName,basicInfo.lastName'
  },
  tasks: {
    'assignedTo': 'basicInfo.firstName,basicInfo.lastName',
    'createdBy': 'basicInfo.firstName,basicInfo.lastName',
    'taskType': 'name'
  },
  attendances: {
    'employee': 'basicInfo.firstName,basicInfo.lastName'
  },
  agents: {
    'client': 'name'
  }
};

export function getDefaultPopulateFields(modelName, populatePath) {
  return DEFAULT_POPULATE_FIELDS[modelName]?.[populatePath] || 'name';
}