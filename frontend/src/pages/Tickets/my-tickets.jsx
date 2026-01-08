import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/authProvider';
import TableGenerator from '../../components/Common/TableGenerator';
import FormRenderer from '../../components/Common/FormRenderer';
import { Plus, User } from 'lucide-react';

const MyTickets = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);

    useEffect(() => {
        fetchMyTickets();
    }, []);

    const fetchMyTickets = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/populate/read/tickets?filter={"$or":[{"createdBy":"${user.id}"},{"assignedTo":"${user.id}"}]}&fields=assignedTo,accountManager,createdBy,linkedTaskId`);
            const ticketsData = response.data.data || [];
            setTickets(ticketsData);
        } catch (error) {
            console.error('Error fetching my tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (formData) => {
        try {
            await axiosInstance.post('/populate/create/tickets', {
                ...formData,
                createdBy: user.id
            });
            fetchMyTickets();
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    };

    const handleUpdateTicket = async (formData) => {
        try {
            await axiosInstance.put(`/populate/update/tickets/${editingTicket._id}`, formData);
            fetchMyTickets();
            setEditingTicket(null);
        } catch (error) {
            console.error('Error updating ticket:', error);
            throw error;
        }
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
    };

    const ticketFormFields = [
        { name: 'title', label: 'Title', type: 'text', placeholder: 'Brief description of the issue', gridClass: 'col-span-2' },
        { name: 'userStory', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the issue...', rows: 4, gridClass: 'col-span-2' },
        { name: 'product', label: 'Product', type: 'text', placeholder: 'Product name' },
        {
            name: 'type', label: 'Type', type: 'AutoComplete', source: '', options: [
                { _id: 'Bug', name: 'Bug' },
                { _id: 'Feature', name: 'Feature' },
                { _id: 'Enhancement', name: 'Enhancement' },
                { _id: 'Support', name: 'Support' }
            ]
        },
        {
            name: 'priority', label: 'Priority', type: 'AutoComplete', source: '', options: [
                { _id: 'Low', name: 'Low' },
                { _id: 'Medium', name: 'Medium' },
                { _id: 'High', name: 'High' },
                { _id: 'Critical', name: 'Critical' }
            ]
        },
        { name: 'dueDate', label: 'Due Date', type: 'date' }
    ];

    const customRender = {
        type: (ticket) => (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {ticket.type || 'Bug'}
            </span>
        ),
        userStory: (ticket) => (
            <span className="max-w-[250px] truncate block" title={ticket.userStory}>
                {ticket.userStory || ticket.description || '-'}
            </span>
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
        createdAt: (ticket) => (
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        ),
        __actions: (ticket) => (
            <button
                onClick={() => handleEdit(ticket)}
                className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
                Edit
            </button>
        )
    };

    const myCreatedTickets = tickets.filter(t => t.createdBy?._id === user.id).length;
    const myAssignedTickets = tickets.filter(t => t.assignedTo?.some(a => a._id === user.id)).length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading tickets...</div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <User className="h-6 w-6" />
                        My Tickets
                    </h1>
                    <p className="text-gray-600 text-sm">Tickets created by you or assigned to you</p>
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
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <div className="pb-2">
                        <h3 className="text-sm font-medium text-blue-600">Created by Me</h3>
                    </div>
                    <div className="text-2xl font-bold">{myCreatedTickets}</div>
                </div>

                <div className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                    <div className="pb-2">
                        <h3 className="text-sm font-medium text-green-600">Assigned to Me</h3>
                    </div>
                    <div className="text-2xl font-bold">{myAssignedTickets}</div>
                </div>

                <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-4">
                    <div className="pb-2">
                        <h3 className="text-sm font-medium text-orange-600">Open Tickets</h3>
                    </div>
                    <div className="text-2xl font-bold">{openTickets}</div>
                </div>
            </div>
            {/* Table */}
            <TableGenerator
                data={tickets}
                customRender={customRender}
                hiddenColumns={['_id', 'updatedAt', 'ticketId', 'createdBy', 'assignedTo', 'accountManager', 'department', 'clientId', 'taskTypeId', 'isConvertedToTask', 'convertedBy', 'convertedAt', 'attachments', 'startDate', 'liveHours', 'comments', 'resolvedAt', 'closedAt', 'resolution', 'description', 'impactAnalysis', 'url', 'acceptanceCriteria', 'linkedTaskId', 'dueDate', 'product', 'priority']}
                enableActions={true}
                onEdit={handleEdit}
            />

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold">Create New Ticket</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <FormRenderer
                                fields={ticketFormFields}
                                onSubmit={handleCreateTicket}
                                submitButton={{ text: 'Create Ticket', color: 'blue' }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Ticket Modal */}
            {editingTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold">Edit Ticket</h2>
                            <button onClick={() => setEditingTicket(null)} className="text-gray-500 hover:text-gray-700">
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <FormRenderer
                                fields={ticketFormFields}
                                data={editingTicket}
                                onSubmit={handleUpdateTicket}
                                submitButton={{ text: 'Update Ticket', color: 'green' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTickets;