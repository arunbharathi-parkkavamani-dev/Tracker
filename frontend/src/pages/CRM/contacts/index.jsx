import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";
import FloatingCard from "../../../components/Common/FloatingCard";
import FormRenderer from "../../../components/Common/FormRenderer";

const CRMContacts = () => {
  const [clients, setClients] = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false);

  const milestoneFormFields = [
    { 
      name: "milestoneId", 
      label: "Milestone", 
      type: "AutoComplete", 
      required: true,
      source: "/populate/read/milestones"
    },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: [
        { value: "Pending", label: "Pending" },
        { value: "In Progress", label: "In Progress" },
        { value: "Completed", label: "Completed" },
        { value: "On Hold", label: "On Hold" }
      ],
      defaultValue: "Pending"
    },
    { name: "dueDate", label: "Due Date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" }
  ];

  const fetchClients = async () => {
    try {
      const res = await axiosInstance.get("/populate/read/clients?limit=1000");
      setClients(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };



  useEffect(() => {
    fetchClients();
  }, []);

  const updateLeadStatus = async (clientId, newStatus) => {
    try {
      await axiosInstance.put(`/populate/update/clients/${clientId}`, {
        leadStatus: newStatus
      });
      fetchClients();
    } catch (err) {
      console.error("Error updating lead status:", err);
    }
  };

  const handleMilestoneSubmit = async (formData) => {
    try {
      await axiosInstance.put(`/populate/update/clients/${selectedClient._id}`, {
        $push: { milestones: formData }
      });
      
      // Create centralized task for milestone
      await axiosInstance.post("/populate/create/tasks", {
        clientId: selectedClient._id,
        milestoneId: formData.milestoneId,
        title: `Milestone Task - ${selectedClient.name}`,
        status: "To Do",
        milestoneStatus: formData.status
      });

      setMilestoneFormOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (err) {
      console.error("Error adding milestone:", err);
    }
  };

  const tableData = clients.map(client => ({
    _id: client._id,
    name: client.name,
    ownerName: client.ownerName,
    businessType: client.businessType,
    email: client.contactInfo?.[0]?.email || client.email,
    phone: client.contactInfo?.[0]?.phone || client.phone,
    leadStatus: client.leadStatus,
    Status: client.Status,
    milestoneCount: client.milestones?.length || 0,
    clientData: client
  }));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl">CRM - Client Contacts</h3>
      </div>

      <TableGenerator
        data={tableData}
        hiddenColumns={["_id", "clientData"]}
        customRender={{
          leadStatus: (row) => (
            <select
              value={row.leadStatus}
              onChange={(e) => updateLeadStatus(row._id, e.target.value)}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          ),
          Status: (row) => (
            <span className={`px-2 py-1 text-xs rounded-full ${
              row.Status === "Active" 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {row.Status}
            </span>
          ),
          milestoneCount: (row) => (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {row.milestoneCount} Milestones
              </span>
              {row.Status === "Active" ? (
                <button
                  onClick={() => {
                    setSelectedClient(row.clientData);
                    setMilestoneFormOpen(true);
                  }}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                >
                  Add Milestone
                </button>
              ) : (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Order Required
                </span>
              )}
            </div>
          )
        }}
        onEdit={(row) => {
          setSelectedClient(row.clientData);
          setModelOpen(true);
        }}
      />

      {milestoneFormOpen && (
        <FloatingCard
          title={`Add Milestone - ${selectedClient?.name}`}
          onClose={() => {
            setMilestoneFormOpen(false);
            setSelectedClient(null);
          }}
        >
          <FormRenderer
            fields={milestoneFormFields}
            onSubmit={handleMilestoneSubmit}
          />
        </FloatingCard>
      )}

      {modelOpen && selectedClient && (
        <FloatingCard
          title={`Client Details - ${selectedClient.name}`}
          onClose={() => {
            setModelOpen(false);
            setSelectedClient(null);
          }}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Milestones</h4>
              {selectedClient.milestones?.length > 0 ? (
                <div className="space-y-2">
                  {selectedClient.milestones.map((milestone, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {formData.milestoneId?.name || 'Unknown Milestone'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          milestone.status === "Completed" 
                            ? "bg-green-100 text-green-800"
                            : milestone.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {milestone.status}
                        </span>
                      </div>
                      {milestone.dueDate && (
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {milestone.notes && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No milestones added yet</p>
              )}
            </div>
          </div>
        </FloatingCard>
      )}
    </div>
  );
};

export default CRMContacts;