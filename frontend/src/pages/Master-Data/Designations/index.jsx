import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";
import {
  designationFormFields,
  designationSubmitButton
} from "../../../constants/DesignationForm";
import toast from "react-hot-toast";

const Designations = () => {
  const [data, setData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/populate/read/designations?limit=1000");
      const cleanData = (res.data?.data || []).map(item => {
        const { professionalInfo, ...cleanItem } = item;
        return cleanItem;
      });
      setData(cleanData);
    } catch (err) {
      console.error("Error fetching designations:", err);
      toast.error("Failed to fetch designations");
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
    if (!window.confirm(`Are you sure you want to delete "${row.title}"?`)) return;
    try {
      await axiosInstance.delete(`/populate/delete/designations/${row._id}`);
      toast.success("Designation deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete designation");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/populate/update/designations/${editingItem._id}`, formData);
        toast.success("Designation updated successfully");
      } else {
        await axiosInstance.post("/populate/create/designations", formData);
        toast.success("Designation created successfully");
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
    title: (row) => <span className="font-semibold text-gray-800">{row.title}</span>,
    description: (row) => <span className="text-gray-600">{row.description || '-'}</span>
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Designations</h1>
          <p className="text-gray-500">Manage employee designations</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setModelOpen(true);
          }}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Add Designation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <TableGenerator
          data={data}
          customColumns={['title', 'description']}
          hiddenColumns={["_id", "createdAt", "updatedAt", "__v", "professionalInfo", "Status"]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          customRender={customRender}
          loading={loading}
        />
      </div>

      {modelOpen && (
        <FloatingCard
          title={editingItem ? "Edit Designation" : "Add Designation"}
          close={() => {
            setModelOpen(false);
            setEditingItem(null);
          }}
        >
          <FormRenderer
            fields={designationFormFields}
            submitButton={designationSubmitButton}
            onSubmit={handleSubmit}
            initialValues={editingItem}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default Designations;