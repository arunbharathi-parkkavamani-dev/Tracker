import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";
import toast from "react-hot-toast";

const Roles = () => {
  const [data, setData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const formFields = [
    { name: "name", label: "Role Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    {
      name: "isActive",
      label: "Status",
      type: "select",
      options: [
        { name: "Active", value: true },
        { name: "Inactive", value: false }
      ],
      default: true
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/populate/read/roles?limit=1000");
      setData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (row) => {
    setEditingItem(row);
    setModelOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete "${row.name}"?`)) return;
    try {
      await axiosInstance.delete(`/populate/delete/roles/${row._id}`);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete role");
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = !row.isActive;
      await axiosInstance.put(`/populate/update/roles/${row._id}`, { isActive: newStatus });
      toast.success(`Role ${newStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        isActive: formData.isActive === 'true' || formData.isActive === true
      };

      if (editingItem) {
        await axiosInstance.put(`/populate/update/roles/${editingItem._id}`, payload);
        toast.success("Role updated successfully");
      } else {
        await axiosInstance.post("/populate/create/roles", payload);
        toast.success("Role created successfully");
      }
      setModelOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const customRender = {
    isActive: (row) => (
      <button
        onClick={() => toggleStatus(row)}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${row.isActive
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
      >
        {row.isActive ? "Active" : "Inactive"}
      </button>
    ),
    capabilities: (row) => (
      <span className="text-gray-600 text-sm">
        {Array.isArray(row.capabilities) ? row.capabilities.length : 0} permissions
      </span>
    )
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Roles</h1>
          <p className="text-gray-500">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setModelOpen(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Add Role
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <TableGenerator
          data={data}
          customColumns={['name', 'description', 'isActive', 'capabilities']}
          hiddenColumns={["_id", "createdAt", "updatedAt", "__v", "navAccess", "permissions"]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          customRender={customRender}
          loading={loading}
        />
      </div>

      {modelOpen && (
        <FloatingCard
          title={editingItem ? "Edit Role" : "Add Role"}
          close={() => {
            setModelOpen(false);
            setEditingItem(null);
          }}
        >
          <FormRenderer
            fields={formFields}
            onSubmit={handleSubmit}
            initialValues={editingItem}
            submitBtnText={editingItem ? "Update" : "Create"}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default Roles;