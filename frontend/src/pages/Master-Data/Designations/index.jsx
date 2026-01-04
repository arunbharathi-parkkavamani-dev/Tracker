import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";
import {
  designationFormFields,
  designationSubmitButton
} from "../../../constants/DesignationForm";

const Designations = () => {
  const [data, setData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/designations?limit=1000");
      const cleanData = (res.data?.data || []).map(item => {
        const { professionalInfo, ...cleanItem } = item;
        return cleanItem;
      });
      setData(cleanData);
    } catch (err) {
      console.error("Error fetching designations:", err);
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
      await axiosInstance.delete(`/populate/delete/designations/${row._id}`);
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.Status === "Active" ? "Inactive" : "Active";
      await axiosInstance.put(`/populate/update/designations/${row._id}`, { Status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await axiosInstance.put(`/populate/update/designations/${editingItem._id}`, formData);
      } else {
        await axiosInstance.post("/populate/create/designations", formData);
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
        <h3 className="text-2xl">Designations</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setModelOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Designation
        </button>
      </div>

      <TableGenerator
        data={data}
        hiddenColumns={["_id", "createdAt", "updatedAt", "__v", "professionalInfo"]}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {modelOpen && (
        <FloatingCard
          title={editingItem ? "Edit Designation" : "Add Designation"}
          onClose={() => {
            setModelOpen(false);
            setEditingItem(null);
          }}
        >
          <FormRenderer
            fields={designationFormFields}
            submitButton={designationSubmitButton}
            onSubmit={handleSubmit}
            data={editingItem}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default Designations;