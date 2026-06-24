import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import { entityFormPath } from "../../../utils/formRoutes";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

const Menu = () => {
  const navigate = useNavigate();
  const [sidebarData, setSidebarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const basePath = "/Settings/Menu";

  const fetchSidebar = async () => {
    try {
      setLoading(true);
      const filterObj = JSON.stringify({ isActive: { $in: [true, false] } });
      const response = await axiosInstance.get(`populate/read/sidebars?limit=100&sort=-order&filter=${encodeURIComponent(filterObj)}`);
      setSidebarData(
        (response.data.data || []).map((item) => ({
          ...item,
          _id: item._id?.$oid || item._id,
        }))
      );
    } catch (error) {
      console.error("Error fetching sidebar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebar();
  }, []);

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete "${row.title}"?`)) return;
    try {
      await axiosInstance.delete(`populate/delete/sidebars/${row._id}`);
      toast.success("Menu item deleted successfully");
      fetchSidebar();
    } catch (error) {
      console.error("Error deleting sidebar:", error);
      toast.error("Failed to delete menu item");
    }
  };

  const customRender = {
    icon: (row) => (
      <div className="flex items-center gap-2">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {row.icon?.iconName || "No Icon"}{" "}
          <span className="text-gray-400">({row.icon?.iconPackage || "None"})</span>
        </span>
      </div>
    ),
    parentId: (row) => <span>{row.parentId?.title || "-"}</span>,
    isActive: (row) => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
    allowedDepartments: (row) => (
      <span className="text-xs text-gray-500">{row.allowedDepartments?.length || 0} depts</span>
    ),
    allowedDesignations: (row) => (
      <span className="text-xs text-gray-500">{row.allowedDesignations?.length || 0} roles</span>
    ),
  };

  return (
    <div className="p-6 space-y-6 bg-canvas-muted dark:bg-canvas min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Menu Management</h1>
          <p className="text-ink-muted text-sm">Manage sidebar menu items and structure</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(entityFormPath(basePath))}
          className="tracker-btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Add Menu Item
        </button>
      </div>

      <div className="tracker-card overflow-hidden">
        <TableGenerator
          data={sidebarData}
          customRender={customRender}
          onEdit={(row) => navigate(entityFormPath(basePath, row._id))}
          onDelete={handleDelete}
          hiddenColumns={["_id", "__v", "createdAt", "updatedAt", "routes"]}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Menu;
