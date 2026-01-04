import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";

const Roles = () => {
  const [data, setData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const formFields = [
    { name: "name", label: "Role Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "Status", label: "Status", type: "select", options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" }
    ], defaultValue: "Active" }
  ];

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/roles?limit=1000");
      setData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
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
    try {
      await axiosInstance.delete(`/populate/delete/roles/${row._id}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.Status === "Active" ? "Inactive" : "Active";
      await axiosInstance.put(`/populate/update/roles/${row._id}`, { Status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/populate/update/roles/${editingItem._id}`, formData);
      } else {
        await axiosInstance.post("/populate/create/roles", formData);
      }
      setModelOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl">Roles</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setModelOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Role
        </button>
      </div>

      <TableGenerator
        data={data}
        hiddenColumns={["_id"]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customRender={{
          Status: (row) => (
            <button
              onClick={() => toggleStatus(row)}
              className={`px-2 py-1 text-xs rounded-full ${
                row.Status === "Active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {row.Status}
            </button>
          ),
        }}
      />

      {modelOpen && (
        <FloatingCard
          title={editingItem ? "Edit Role" : "Add Role"}
          onClose={() => {
            setModelOpen(false);
            setEditingItem(null);
          }}
        >
          <FormRenderer
            fields={formFields}
            onSubmit={handleSubmit}
            data={editingItem}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default Roles;