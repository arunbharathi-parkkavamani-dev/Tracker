import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";

const Employees = () => {
  const [data, setData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const formFields = [
    // Basic Info Section
    { name: "basicInfo.firstName", label: "First Name", type: "text", required: true },
    { name: "basicInfo.lastName", label: "Last Name", type: "text", required: true },
    { name: "basicInfo.dob", label: "Date of Birth", type: "date" },
    { name: "basicInfo.doa", label: "Date of Anniversary", type: "date" },
    { name: "basicInfo.maritalStatus", label: "Marital Status", type: "select", options: [
      { value: "Single", label: "Single" },
      { value: "Married", label: "Married" },
      { value: "Divorced", label: "Divorced" },
      { value: "Widowed", label: "Widowed" }
    ]},
    { name: "basicInfo.phone", label: "Phone", type: "text" },
    { name: "basicInfo.email", label: "Personal Email", type: "email" },
    { name: "basicInfo.fatherName", label: "Father Name", type: "text" },
    { name: "basicInfo.motherName", label: "Mother Name", type: "text" },
    { name: "basicInfo.address.street", label: "Street Address", type: "text" },
    { name: "basicInfo.address.city", label: "City", type: "text" },
    { name: "basicInfo.address.state", label: "State", type: "text" },
    { name: "basicInfo.address.zip", label: "ZIP Code", type: "text" },
    { name: "basicInfo.address.country", label: "Country", type: "text" },

    // Professional Info Section
    { name: "professionalInfo.empId", label: "Employee ID", type: "text", required: true },
    { name: "professionalInfo.designation", label: "Designation", type: "select", 
      options: designations.map(d => ({ value: d._id, label: d.name })) },
    { name: "professionalInfo.department", label: "Department", type: "select", 
      options: departments.map(d => ({ value: d._id, label: d.name })) },
    { name: "professionalInfo.role", label: "Role", type: "select", 
      options: roles.map(r => ({ value: r._id, label: r.name })) },
    { name: "professionalInfo.reportingManager", label: "Reporting Manager", type: "select", 
      options: employees.map(e => ({ 
        value: e._id, 
        label: `${e.basicInfo?.firstName || ''} ${e.basicInfo?.lastName || ''}`.trim() || e.basicInfo?.firstName || 'Unknown'
      })) },
    { name: "professionalInfo.teamLead", label: "Team Lead", type: "select", 
      options: employees.map(e => ({ 
        value: e._id, 
        label: `${e.basicInfo?.firstName || ''} ${e.basicInfo?.lastName || ''}`.trim() || e.basicInfo?.firstName || 'Unknown'
      })) },
    { name: "professionalInfo.level", label: "Level", type: "select", options: [
      { value: "L1", label: "L1" },
      { value: "L2", label: "L2" },
      { value: "L3", label: "L3" },
      { value: "L4", label: "L4" }
    ]},
    { name: "professionalInfo.doj", label: "Date of Joining", type: "date" },
    { name: "professionalInfo.probationPeriod", label: "Probation Period", type: "text" },
    { name: "professionalInfo.confirmDate", label: "Confirmation Date", type: "date" },

    // Auth Info Section
    { name: "authInfo.workEmail", label: "Work Email", type: "email", required: true },
    { name: "authInfo.password", label: "Password", type: "password" },

    // Account Details Section
    { name: "accountDetails.accountName", label: "Account Name", type: "text" },
    { name: "accountDetails.accountNo", label: "Account Number", type: "text" },
    { name: "accountDetails.bankName", label: "Bank Name", type: "text" },
    { name: "accountDetails.branch", label: "Branch", type: "text" },
    { name: "accountDetails.ifscCode", label: "IFSC Code", type: "text" },

    // Salary Details Section
    { name: "salaryDetails.package", label: "Package", type: "number" },
    { name: "salaryDetails.basic", label: "Basic Salary", type: "number" },
    { name: "salaryDetails.ctc", label: "CTC", type: "number" },
    { name: "salaryDetails.allowances", label: "Allowances", type: "number" },
    { name: "salaryDetails.deductions", label: "Deductions", type: "number" },

    // Personal Documents Section
    { name: "personalDocuments.pan", label: "PAN Number", type: "text" },
    { name: "personalDocuments.aadhar", label: "Aadhar Number", type: "text" },
    { name: "personalDocuments.esi", label: "ESI Number", type: "text" },
    { name: "personalDocuments.pf", label: "PF Number", type: "text" },

    // Status
    { name: "status", label: "Status", type: "select", options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Terminated", label: "Terminated" }
    ], defaultValue: "Active" }
  ];

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/employees?limit=1000");
      setData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [deptRes, desigRes, roleRes, empRes] = await Promise.all([
        axiosInstance.get("/populate/read/departments?limit=1000"),
        axiosInstance.get("/populate/read/designations?limit=1000"),
        axiosInstance.get("/populate/read/roles?limit=1000"),
        axiosInstance.get("/populate/read/employees?limit=1000")
      ]);
      
      setDepartments(deptRes.data?.data || []);
      setDesignations(desigRes.data?.data || []);
      setRoles(roleRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  const handleEdit = (row) => {
    setEditingItem(row);
    setModelOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await axiosInstance.delete(`/populate/delete/employees/${row._id}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.status === "Active" ? "Inactive" : "Active";
      await axiosInstance.put(`/populate/update/employees/${row._id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/populate/update/employees/${editingItem._id}`, formData);
      } else {
        await axiosInstance.post("/populate/create/employees", formData);
      }
      setModelOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const tableData = data.map(emp => {
    return {
      _id: emp._id,
      empId: emp.professionalInfo?.empId || '-',
      name: `${emp.basicInfo?.firstName || ''} ${emp.basicInfo?.lastName || ''}`.trim() || '-',
      email: emp.authInfo?.workEmail || '-',
      department: emp.professionalInfo?.department?.name || '-',
      designation: emp.professionalInfo?.designation?.title || emp.professionalInfo?.designation?.name || '-',
      role: emp.professionalInfo?.role?.name || '-',
      reportingManager: emp.professionalInfo?.reportingManager?.basicInfo?.firstName || '-',
      doj: emp.professionalInfo?.doj ? new Date(emp.professionalInfo.doj).toLocaleDateString() : '-',
      status: emp.status || 'Active'
    };
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl">Employee Master</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setModelOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Employee
        </button>
      </div>

      <TableGenerator
        data={tableData}
        hiddenColumns={["_id", "basicInfo", "professionalInfo", "authInfo", "accountDetails", "salaryDetails", "personalDocuments", "professionalDocuments", "leaveStatus", "isActive", "createdAt", "updatedAt", "__v"]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customRender={{
          status: (row) => (
            <button
              onClick={() => toggleStatus(row)}
              className={`px-2 py-1 text-xs rounded-full ${
                row.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : row.status === "Inactive"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {row.status}
            </button>
          ),
        }}
      />

      {modelOpen && (
        <FloatingCard
          title={editingItem ? "Edit Employee" : "Add Employee"}
          onClose={() => {
            setModelOpen(false);
            setEditingItem(null);
          }}
        >
          <div className="max-h-96 overflow-y-auto">
            <FormRenderer
              fields={formFields}
              onSubmit={handleSubmit}
              data={editingItem}
            />
          </div>
        </FloatingCard>
      )}
    </div>
  );
};

export default Employees;