import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import PolicyGuard from "../../../components/Common/PolicyGuard";
import { useUserRole } from "../../../hooks/useUserRole";
import { entityFormPath } from "../../../utils/formRoutes";
import { clientsConfig } from "./config";

const Clients = () => {
  const navigate = useNavigate();
  const { userRole, policies } = useUserRole();
  const roleLower = (userRole || "").toLowerCase();
  const canUpdate =
    roleLower === "super admin" ||
    roleLower === "admin" ||
    (policies?.clients?.update);
  const canDelete =
    roleLower === "super admin" ||
    roleLower === "admin" ||
    (policies?.clients?.delete);

  const [clientsData, setClientsData] = useState([]);
  const [agentsData, setAgentsData] = useState([]);
  const basePath = clientsConfig.basePath;

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.post("/populate/read/clients", { limit: 1000 });
      setClientsData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axiosInstance.get(
        `/populate/read/agents?populateFields=${encodeURIComponent(JSON.stringify({ client: "name" }))}`
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

  const tableData = clientsData.map((client) => {
    const clientAgents = agentsData.filter(
      (agent) => agent.client?._id === client._id || agent.client === client._id
    );
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
      clientData: client,
    };
  });

  const handleDelete = async (row) => {
    try {
      await axiosInstance.delete(`/populate/delete/clients/${row._id}`);
      fetchClients();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleStatus = async (row) => {
    try {
      const newStatus = row.Status === "Active" ? "Inactive" : "Active";
      await axiosInstance.put(`/populate/update/clients/${row._id}`, { Status: newStatus });
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
      await axiosInstance.post("/populate/create/agents", {
        name: firstContact.name,
        email: firstContact.email,
        phone: firstContact.phone,
        client: client._id,
      });
      fetchAgents();
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-canvas-muted dark:bg-canvas min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clients</h1>
          <p className="text-ink-muted text-sm">Client and lead management</p>
        </div>
        <PolicyGuard model="clients" action="create" requiredRoles={["hr admin", "hr", "super admin", "admin"]}>
          <button
            type="button"
            onClick={() => navigate(entityFormPath(basePath))}
            className="tracker-btn-accent px-4 py-2"
          >
            Add Client
          </button>
        </PolicyGuard>
      </div>

      <div className="tracker-card overflow-hidden">
        <TableGenerator
          data={tableData}
          customColumns={["agents"]}
          hiddenColumns={["_id", "clientData"]}
          onEdit={canUpdate ? (row) => navigate(entityFormPath(basePath, row._id)) : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          customRender={{
            Status: (row) => (
              <button
                type="button"
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
                ) : row.Status === "Active" ? (
                  <button
                    type="button"
                    onClick={() => createAgent(row.clientData)}
                    className="px-3 py-1 text-xs bg-tracker-success text-white rounded hover:opacity-90"
                  >
                    Add Agent
                  </button>
                ) : (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    Order Required
                  </span>
                )}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default Clients;
