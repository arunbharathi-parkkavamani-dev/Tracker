'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT Support',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('agentToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('agentToken');
      const agentId = localStorage.getItem('agentId');
      
      const response = await fetch(`http://localhost:3000/api/populate/read/tickets?filter={"createdBy":"${agentId}"}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-source': 'external'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('agentToken');
      const agentId = localStorage.getItem('agentId');
      const clientId = localStorage.getItem('clientId');

      const response = await fetch('http://localhost:3000/api/populate/create/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-source': 'external'
        },
        body: JSON.stringify({
          ...formData,
          createdBy: agentId,
          clientId: clientId
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setFormData({ title: '', description: '', category: 'IT Support', priority: 'Medium' });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('agentToken');
      await fetch('http://localhost:3000/api/agent/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-source': 'external'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agentId');
      localStorage.removeItem('clientId');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Agent Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Create Ticket
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Tickets</h2>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <li key={ticket._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="text-sm text-gray-500">{ticket.priority} Priority</span>
                        <span className="text-sm text-gray-500">{ticket.category}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tickets found. Create your first ticket!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="IT Support">IT Support</option>
                    <option value="HR Query">HR Query</option>
                    <option value="Facility">Facility</option>
                    <option value="Finance">Finance</option>
                    <option value="Development">Development</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}