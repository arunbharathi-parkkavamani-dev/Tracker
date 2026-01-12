import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import TableGenerator from '../../../components/Common/TableGenerator';
import FormRenderer from '../../../components/Common/FormRenderer';
import FloatingCard from '../../../components/Common/FloatingCard';
import { SidebarForm } from '../../../constants/SidebarFrom';
import { Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const Menu = () => {
    const [sidebarData, setSidebarData] = useState([]);
    const [modelOpen, setModelOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchSidebar = async () => {
        try {
            setLoading(true);
            // Using 'sidebars' to match the mongoose model name
            const response = await axiosInstance.get('populate/read/sidebars?limit=100&sort=-order');
            setSidebarData(response.data.data);
        } catch (error) {
            console.error('Error fetching sidebar:', error);
            // fallup in case 'sidebars' fails, try 'sidebar' or handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSidebar();
    }, []);

    const handleEdit = (row) => {
        setEditItem(row);
        setModelOpen(true);
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Are you sure you want to delete "${row.title}"?`)) return;
        try {
            await axiosInstance.delete(`populate/delete/sidebars/${row._id}`);
            toast.success("Menu item deleted successfully");
            fetchSidebar();
        } catch (error) {
            console.error('Error deleting sidebar:', error);
            toast.error("Failed to delete menu item");
        }
    };

    const handleSubmit = async (formData) => {
        if (!formData) return;

        // Ensure icon nested structure if form returns flat or partial
        // The FormRenderer likely returns the structure defined in the name attributes, i.e., "icon.iconName"

        const payload = {
            ...formData,
            isActive: formData.isActive === undefined ? true : formData.isActive === 'true' || formData.isActive === true,
            isParent: formData.isParent === 'true' || formData.isParent === true,
            hasChildren: formData.hasChildren === 'true' || formData.hasChildren === true
        };

        try {
            if (editItem) {
                await axiosInstance.put(`populate/update/sidebars/${editItem._id}`, payload);
                toast.success("Menu item updated successfully");
            } else {
                await axiosInstance.post('populate/create/sidebars', payload);
                toast.success("Menu item created successfully");
            }
            setModelOpen(false);
            setEditItem(null);
            fetchSidebar();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    // Custom Render Logic for specific columns
    const customRender = {
        icon: (row) => (
            <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {row.icon?.iconName || 'No Icon'} <span className="text-gray-400">({row.icon?.iconPackage || 'None'})</span>
                </span>
            </div>
        ),
        parentId: (row) => (
            <span>{row.parentId?.title || '-'}</span>
        ),
        isActive: (row) => (
            <span className={`px-2 py-1 rounded text-xs ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {row.isActive ? 'Active' : 'Inactive'}
            </span>
        ),
        allowedDepartments: (row) => (
            <span className="text-xs text-gray-500">
                {row.allowedDepartments?.length || 0} depts
            </span>
        ),
        allowedDesignations: (row) => (
            <span className="text-xs text-gray-500">
                {row.allowedDesignations?.length || 0} roles
            </span>
        )
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
                    <p className="text-gray-500">Manage sidebar menu items and structure</p>
                </div>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setModelOpen(true);
                    }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={18} />
                    Add Menu Item
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <TableGenerator
                    data={sidebarData}
                    customRender={customRender}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    hiddenColumns={['_id', '__v', 'createdAt', 'updatedAt', 'routes']}
                    loading={loading}
                />
            </div>

            {modelOpen && (
                <FloatingCard
                    title={editItem ? "Edit Menu Item" : "Create Menu Item"}
                    close={() => {
                        setModelOpen(false);
                        setEditItem(null);
                    }}
                >
                    <FormRenderer
                        fields={SidebarForm}
                        onSubmit={handleSubmit}
                        initialValues={editItem}
                        startLoading={loading}
                        submitBtnText={editItem ? "Update" : "Create"}
                    />
                </FloatingCard>
            )}
        </div>
    );
};

export default Menu;