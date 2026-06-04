import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import EntityFormPage from "../Forms/EntityFormPage";
import toast from "react-hot-toast";

const MasterDataFormView = ({ config, fields: fieldsProp }) => {
  const navigate = useNavigate();
  const {
    model,
    title,
    subtitle,
    basePath,
    fields: configFields = [],
    tabs,
    submitButton,
    singularName,
    transformSubmit,
    loadRecord: customLoad,
  } = config;

  const fields = fieldsProp || configFields;
  const label = singularName || title.replace(/s$/, "");

  const loadRecord = customLoad
    ? customLoad
    : async (id) => {
        const res = await axiosInstance.get(`/populate/read/${model}/${id}`);
        return res.data?.data;
      };

  const handleSubmit = async (formData) => {
    const id = new URLSearchParams(window.location.search).get("id");
    const payload = transformSubmit ? transformSubmit(formData) : formData;
    try {
      if (id) {
        await axiosInstance.put(`/populate/update/${model}/${id}`, payload);
        toast.success(`${label} updated`);
      } else {
        await axiosInstance.post(`/populate/create/${model}`, payload);
        toast.success(`${label} created`);
      }
      navigate(basePath);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Save failed");
      throw err;
    }
  };

  return (
    <EntityFormPage
      title={label}
      subtitle={subtitle}
      backTo={basePath}
      fields={fields}
      tabs={tabs}
      submitButton={submitButton}
      loadRecord={loadRecord}
      onSubmit={handleSubmit}
    />
  );
};

export default MasterDataFormView;
