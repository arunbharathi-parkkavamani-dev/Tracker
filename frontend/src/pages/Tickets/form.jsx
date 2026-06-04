import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import EntityFormPage from "../../components/Forms/EntityFormPage";
import {
  TICKET_FORM_TABS,
  ticketFormFields,
  ticketSubmitButton,
} from "../../constants/ticketForm";
import toast from "react-hot-toast";

const TicketsFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const handleSubmit = async (formData) => {
    try {
      if (id) {
        const { createdBy, ...updateData } = formData;
        await axiosInstance.put(`/populate/update/tickets/${id}`, updateData);
        toast.success("Ticket updated");
      } else {
        await axiosInstance.post("/populate/create/tickets", formData);
        toast.success("Ticket created");
      }
      navigate("/Tickets");
    } catch (err) {
      console.error("Ticket save error:", err);
      toast.error(err.response?.data?.message || "Save failed");
      throw err;
    }
  };

  const loadRecord = id
    ? async (recordId) => {
        const res = await axiosInstance.get(`/populate/read/tickets/${recordId}`);
        return res.data?.data;
      }
    : undefined;

  return (
    <EntityFormPage
      title="Ticket"
      subtitle="Create or update support tickets"
      backTo="/Tickets"
      fields={ticketFormFields}
      tabs={TICKET_FORM_TABS}
      submitButton={{
        ...ticketSubmitButton,
        text: id ? "Update Ticket" : "Create Ticket",
      }}
      loadRecord={loadRecord}
      onSubmit={handleSubmit}
      maxWidth="max-w-4xl"
    />
  );
};

export default TicketsFormPage;
