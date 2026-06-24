import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import EntityFormPage from "../../../components/Forms/EntityFormPage";
import { SidebarForm } from "../../../constants/SidebarFrom";
import toast from "react-hot-toast";

const MENU_FORM_TABS = [
  {
    id: "item",
    label: "Menu item",
    fieldNames: ["title", "mainRoute", "icon.iconName", "icon.iconPackage", "parentId", "order"],
  },
  {
    id: "access",
    label: "Access",
    fieldNames: [
      "isActive",
      "isParent",
      "hasChildren",
      "allowedDepartments",
      "allowedDesignations",
    ],
  },
];

const MenuFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const handleSubmit = async (formData) => {
    const payload = {
      ...formData,
      isActive: formData.isActive === undefined ? true : formData.isActive === "true" || formData.isActive === true,
      isParent: formData.isParent === "true" || formData.isParent === true,
      hasChildren: formData.hasChildren === "true" || formData.hasChildren === true,
      parentId: formData.parentId?._id || formData.parentId || null,
      allowedDepartments: (formData.allowedDepartments || []).map(d => d._id || d),
      allowedDesignations: (formData.allowedDesignations || []).map(d => d._id || d),
    };

    try {
      if (id) {
        await axiosInstance.put(`populate/update/sidebars/${id}`, payload);
        toast.success("Menu item updated");
      } else {
        await axiosInstance.post("populate/create/sidebars", payload);
        toast.success("Menu item created");
      }
      navigate("/Settings/Menu");
    } catch (err) {
      console.error("Menu save error:", err);
      toast.error(err.response?.data?.message || "Save failed");
      throw err;
    }
  };

  const loadRecord = id
    ? async (recordId) => {
        const res = await axiosInstance.get(`populate/read/sidebars/${recordId}`);
        const item = res.data?.data;
        if (item?._id?.$oid) item._id = item._id.$oid;
        return item;
      }
    : undefined;

  return (
    <EntityFormPage
      title="Menu item"
      subtitle="Sidebar navigation entry"
      backTo="/Settings/Menu"
      fields={SidebarForm}
      tabs={MENU_FORM_TABS}
      submitButton={{ text: id ? "Update menu item" : "Create menu item", color: "blue" }}
      loadRecord={loadRecord}
      onSubmit={handleSubmit}
    />
  );
};

export default MenuFormPage;
