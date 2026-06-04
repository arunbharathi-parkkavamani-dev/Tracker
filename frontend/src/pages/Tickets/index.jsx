import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import TableGenerator from "../../components/Common/TableGenerator";
import { useNavigate } from "react-router-dom";
import { entityFormPath } from "../../utils/formRoutes";
import { Plus, Filter, Search, ArrowUpRight } from "lucide-react";

const TicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/populate/read/tickets', {fields: "assignedTo,accountManager,createdBy,linkedTaskId"});
      const ticketsData = response.data.data || [];
      // Clean the data to remove problematic objects
      const cleanTickets = ticketsData.map(ticket => {
        const { professionalInfo, ...cleanTicket } = ticket;
        return cleanTicket;
      });
      setTickets(cleanTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToTask = async (ticket) => {
    try {
      await axiosInstance.put(`/populate/update/tickets/${ticket._id}`, {
        pushTaskSync: true
      });
      fetchTickets();
    } catch (error) {
      console.error('Error converting ticket to task:', error);
    }
  };

  const handleEdit = (ticket) => {
    navigate(entityFormPath("/Tickets", ticket._id));
  };

  const customRender = {
    type: (ticket) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        {ticket.type || 'Bug'}
      </span>
    ),
    accountManager: (ticket) => (
      <span>
        {ticket.accountManager?.basicInfo?.firstName
          ? `${ticket.accountManager.basicInfo.firstName} ${ticket.accountManager.basicInfo.lastName}`
          : ticket.assignedTo?.[0]?.basicInfo?.firstName
            ? `${ticket.assignedTo[0].basicInfo.firstName} ${ticket.assignedTo[0].basicInfo.lastName}`
            : '-'
        }
      </span>
    ),
    userStory: (ticket) => (
      <span className="max-w-[250px] truncate block" title={ticket.userStory}>
        {ticket.userStory || ticket.description || '-'}
      </span>
    ),
    linkedTaskId: (ticket) => (
      ticket.linkedTaskId ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          Task Created
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          No Task
        </span>
      )
    ),
    status: (ticket) => {
      const colors = {
        'Open': 'bg-blue-50 text-blue-700 border-blue-200',
        'In Progress': 'bg-orange-50 text-orange-700 border-orange-200',
        'Review': 'bg-purple-50 text-purple-700 border-purple-200',
        'Testing': 'bg-cyan-50 text-cyan-700 border-cyan-200',
        'Completed': 'bg-green-50 text-green-700 border-green-200',
        'Closed': 'bg-gray-50 text-gray-700 border-gray-200'
      };
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[ticket.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
          {ticket.status}
        </span>
      );
    },
    dueDate: (ticket) => (
      <span>{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</span>
    ),
    assignedTo: (ticket) => {
      if (!ticket.assignedTo || ticket.assignedTo.length === 0) {
        return <span>-</span>;
      }
      return (
        <div className="flex flex-col gap-1">
          {ticket.assignedTo.map((assignee, idx) => {
            // Handle both populated and non-populated assignee objects
            const firstName = assignee?.basicInfo?.firstName || assignee?.firstName || '';
            const lastName = assignee?.basicInfo?.lastName || assignee?.lastName || '';
            const displayName = `${firstName} ${lastName}`.trim() || 'Unknown';

            return (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {displayName}
              </span>
            );
          })}
        </div>
      );
    },
    __actions: (ticket) => {
      const isConverted =
        ticket.isConvertedToTask || Boolean(ticket.linkedTaskId);

      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(ticket)}
            className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>

          <button
            onClick={() => !isConverted && handlePushToTask(ticket)}
            disabled={isConverted}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isConverted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {isConverted ? 'Converted' : 'Push to Task'}
          </button>
        </div>
      );
    }
  };

  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedThisWeek = tickets.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return t.status === 'Completed' && new Date(t.updatedAt) > weekAgo;
  }).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading tickets...</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-canvas-muted dark:bg-canvas text-ink">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Internal help desk and issue tracking.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(entityFormPath("/Tickets"))}
          className="tracker-btn-accent px-4 py-2 text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900 rounded-lg p-4">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Open Tickets</h3>
          </div>
          <div className="text-2xl font-bold">{openTickets}</div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900 rounded-lg p-4">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400">In Progress</h3>
          </div>
          <div className="text-2xl font-bold">{inProgressTickets}</div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900 rounded-lg p-4">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Resolved (This Week)</h3>
          </div>
          <div className="text-2xl font-bold">{resolvedThisWeek}</div>
        </div>
      </div>

      {/* Table */}
      <TableGenerator
        data={tickets}
        customRender={customRender}
        hiddenColumns={['_id', 'ticketId', 'createdBy', 'department', 'clientId', 'taskTypeId', 'isConvertedToTask', 'convertedBy', 'convertedAt', 'attachments', 'liveHours', 'comments', 'resolvedAt', 'closedAt', 'resolution', 'description', 'impactAnalysis', 'url', 'acceptanceCriteria', '__v']}
        enableActions={true}
        onEdit={handleEdit}
      />

    </div>
  );
};

export default TicketsPage;