import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import EntityFormPage from "../../components/Forms/EntityFormPage";
import {

  TICKET_FORM_TABS,
  clientFormFields,
  ticketFormFields,
  ticketSubmitButton,
} from "../../constants/ticketForm";
import { enqueueFormSubmit } from "../../services/formSubmitQueue";
import { formDraftKey } from "../../utils/formDrafts";
import toast from "react-hot-toast";

const TicketsFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const handleSubmit = (payload, meta) => {
    const draftKey = formDraftKey("tickets", id || "new");
    const isEdit = Boolean(id);

    enqueueFormSubmit({
      draftKey,
      draft: { formData: meta.fullPayload, patch: payload, isEdit },
      execute: async () => {
        if (isEdit) {
          await axiosInstance.put(`/populate/update/tickets/${id}`, payload);
        } else {
          await axiosInstance.post("/populate/create/tickets", meta.fullPayload);
        }
      },
      onSuccess: () =>
        toast.success(isEdit ? "Ticket updated" : "Ticket created"),
    });

    navigate("/Tickets");
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
      fields={[...clientFormFields, ...ticketFormFields]}
      tabs={TICKET_FORM_TABS}
      draftModel="tickets"
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
