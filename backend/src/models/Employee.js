// models/Employee.js
import { Schema, model } from 'mongoose';

const EmployeeSchema = new Schema({
  basicInfo: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    dob: { type: Date },
    doa: { type: Date }, // Date of Anniversary
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    phone: { type: String, validate: { validator: function(v) { return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v); }, message: props => `${props.value} is not a valid phone number!`}},
    email: { type: String, lowercase: true, trim: true, validate: { validator: function(v) { return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); }, message: props => `${props.value} is not a valid email!` }},
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    profileImage: { type: String } // URL
  },

  professionalInfo: {
    empId: { type: String, trim: true },
    designation: { type: Schema.Types.ObjectId, ref: 'Designation' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'Employee' },
    teamLead: { type: Schema.Types.ObjectId, ref: 'Employee' },
    level: { type: String, enum: ['L1', 'L2', 'L3', 'L4'] },
    doj: { type: Date },
    probationPeriod: { type: String }, // e.g., "6 months"
    confirmDate: { type: Date },
  },
  authInfo:{
    workEmail: { type: String, lowercase: true, trim: true, validate: { validator: function(v) { return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); }, message: props => `${props.value} is not a valid email!` } },
    password: { type: String }}, // store hashed

  accountDetails: {
    accountName: { type: String },
    accountNo: { type: String },
    bankName: { type: String },
    branch: { type: String },
    ifscCode: { type: String, validate: { validator: function(v) { return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v); }, message: props => `${props.value} is not a valid IFSC code!` } } },

  salaryDetails: {
    package: { type: Number },
    basic: { type: Number },
    ctc: { type: Number },
    allowances: { type: Number },
    deductions: { type: Number }
  },

  personalDocuments: {
    pan: { 
      type: String,
      validate: {
        validator: function(v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: props => `${props.value} is not a valid PAN number!`
      }
    },
    aadhar: { type: String, validate: { validator: function(v) { return /^\d{12}$/.test(v); }, message: props => `${props.value} is not a valid Aadhar number!` } },
    esi: { type: String },
    pf: { type: String },
    documentFiles: [{ type: String }] // URLs
  },

  professionalDocuments: {
    offerLetter: { type: String }, // URL
    appraisalLetter: { type: String }, // URL
    otherDocuments: [{ type: String }] // URLs
  },

  // Inside Employee schema
  leaveStatus: [
    {
      leaveType: { type: Schema.Types.ObjectId, ref: "LeaveType" },
      usedThisMonth: { type: Number, default: 0 },
      usedThisYear: { type: Number, default: 0 },
      carriedForward: { type: Number, default: 0 },
      available: { type: Number, default: 0 } // auto-calculated from policy
    }
  ],

  status:{ type:String},

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt automatically
EmployeeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Employee', EmployeeSchema);