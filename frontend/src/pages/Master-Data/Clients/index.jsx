import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";
import {
  clientFormFields,
  clientSubmitButton as ClientSubmitButton,
} from "../../../constants/ClientForm";

const Clients = () => {
  const [clientsData, setClientsData] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [agentsData, setAgentsData] = useState([]);

  /* ---------------- Fetch ---------------- */

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get(
        "/populate/read/clients?limit=1000"
      );
      setClientsData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const populateFields = {
        'client': 'name'
      };
      const res = await axiosInstance.get(
        `/populate/read/agents?populateFields=${encodeURIComponent(JSON.stringify(populateFields))}`
      );
      setAgentsData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchAgents();
  }, []);

  /* ---------------- Actions ---------------- */

  const handleEdit = (row) => {
    const client = clientsData.find(c => c.name === row.name);
    setEditingClient(client);
    setModelOpen(true);
  };

  const handleDelete = async (row) => {
    try {
      await axiosInstance.delete(
        `/populate/delete/clients/${row._id}`
      );
      fetchClients();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.Status === "Active" ? "Inactive" : "Active";
      await axiosInstance.put(
        `/populate/update/clients/${row._id}`,
        { Status: newStatus }
      );
      fetchClients();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const createAgent = async (client) => {
    try {
      const firstContact = client.contactInfo?.[0];
      if (!firstContact?.email) {
        alert("No contact person with email found for this client");
        return;
      }

      const payload = {
        name: firstContact.name,
        email: firstContact.email,
        phone: firstContact.phone,
        client: client._id,
      };

      await axiosInstance.post("/populate/create/agents", payload);
      fetchAgents();
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  /* ---------------- Table Data ---------------- */

  const tableData = clientsData.map((client) => {
    const clientAgents = agentsData.filter(agent => agent.client?._id === client._id || agent.client === client._id);
    
    return {
      _id: client._id,
      name: client.name,
      ownerName: client.ownerName,
      phone: client.contactInfo?.[0]?.phone || "-",
      location:
        client.address?.city && client.address?.state
          ? `${client.address.city}, ${client.address.state}`
          : "-",
      Status: client.Status || "Inactive",
      agents: clientAgents,
      clientData: client
    };
  });

  /* ---------------- Create ---------------- */

  const handleSubmit = async (formData) => {
    if (!formData) return;

    const payload = {
      name: formData.name,
      ownerName: formData.ownerName,
      businessType: formData.businessType,
      email: formData.email,
      phone: formData.phone,
      source: formData.source,
      gstIN: formData.gstIN,
      leadStatus: formData.leadStatus,
      referenceType: formData.referenceType,
      leadType: formData.leadType,
      accountManager: formData.accountManager,
      projectManager: formData.projectManager,
      Status: formData.Status,
      address: {
        street: formData.address?.street,
        city: formData.address?.city,
        state: formData.address?.state,
        zip: formData.address?.zip,
        country: formData.address?.country,
      },
      projectTypes: formData.projectTypes || [],
      proposedProducts: formData.proposedProducts || [],
      contactInfo: Array.isArray(formData.contactInfo) 
        ? formData.contactInfo 
        : formData.contactInfo 
        ? [formData.contactInfo] 
        : [],
    };

    try {
      if (editingClient) {
        await axiosInstance.put(`/populate/update/clients/${editingClient._id}`, payload);
      } else {
        await axiosInstance.post("/populate/create/clients", payload);
      }
      setModelOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl">Clients</h3>
        <button
          onClick={() => {
            setEditingClient(null);
            setModelOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Client
        </button>
      </div>

      <TableGenerator
        data={tableData}
        customColumns={["agents"]}
        hiddenColumns={["_id", "clientData"]}
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
          agents: (row) => (
            <div className="flex flex-wrap gap-1">
              {row.agents.length > 0 ? (
                row.agents.map((agent, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {agent.name}
                  </span>
                ))
              ) : (
                row.Status === "Active" ? (
                  <button
                    onClick={() => createAgent(row.clientData)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add Agent
                  </button>
                ) : (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    Order Required
                  </span>
                )
              )}
            </div>
          ),
        }}
      />

      {modelOpen && (
        <FloatingCard
          title={editingClient ? "Edit Client" : "Add Client"}
          onClose={() => {
            setModelOpen(false);
            setEditingClient(null);
          }}
        >
          <FormRenderer
            fields={clientFormFields}
            submitButton={ClientSubmitButton}
            onSubmit={handleSubmit}
            data={editingClient}
          />
        </FloatingCard>
      )}
    </div>
  );
};

export default Clients;
