import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/authProvider";
import CreateTicketModal from "./CreateTicketModal";
import { Plus, Filter, Search, ArrowUpRight } from "lucide-react";

const TicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/populate/read/tickets');
      const ticketsData = response.data.data || [];
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToTask = async (ticketId) => {
    try {
      await axiosInstance.put(`/populate/update/tickets/${ticketId}`, {
        pushTaskSync: true
      });
      fetchTickets(); // Refresh to show updated status
    } catch (error) {
      console.error('Error converting ticket to task:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'open': 'bg-blue-50 text-blue-700 border-blue-200',
      'investigating': 'bg-amber-50 text-amber-700 border-amber-200',
      'resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'closed': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'critical') {
      return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
    } else if (priority === 'high') {
      return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
    }
    return <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'investigating').length;
  const resolvedThisWeek = tickets.filter(t => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return t.status === 'resolved' && new Date(t.updatedAt) > weekAgo;
  }).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Loading tickets...</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 dark:bg-black dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Internal help desk and issue tracking.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
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

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Tickets Table */}
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400 w-[100px]">ID</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Subject</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Requester</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Priority</th>
                <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Created</th>
                <th className="text-right p-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <td className="p-4 font-mono text-xs font-medium text-gray-500">
                    #{ticket.ticketId?.toUpperCase() || ticket._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-4 font-medium">{ticket.title}</td>
                  <td className="p-4">{ticket.createdBy?.basicInfo?.firstName} {ticket.createdBy?.basicInfo?.lastName}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.priority)}
                      <span className="text-sm capitalize text-gray-600 dark:text-gray-400">{ticket.priority}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePushToTask(ticket._id);
                      }}
                      disabled={ticket.isConvertedToTask || ticket.linkedTaskId}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        ticket.isConvertedToTask || ticket.linkedTaskId
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {ticket.isConvertedToTask || ticket.linkedTaskId ? 'Converted' : 'Push to Task'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tickets found
            </div>
          )}
        </div>
      </div>
      
      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchTickets();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TicketsPage;