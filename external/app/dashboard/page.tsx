'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'IT Support',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    } finally {
      setFetching(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
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

  const getStatusChipClass = (status: string) => {
    const map: Record<string, string> = {
      'Open': 'lmx-chip-active',
      'In Progress': 'lmx-chip-inprogress',
      'Pending': 'lmx-chip-pending',
      'Closed': 'lmx-chip-closed',
      'Completed': 'lmx-chip-active',
      'Resolved': 'lmx-chip-active',
    };
    return map[status] || 'lmx-chip-closed';
  };

  const getPriorityChipClass = (priority: string) => {
    const map: Record<string, string> = {
      'Critical': 'lmx-chip-critical',
      'High': 'lmx-chip-high',
      'Medium': 'lmx-chip-medium',
      'Low': 'lmx-chip-low',
    };
    return map[priority] || 'lmx-chip-medium';
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar */}
      <nav className="lmx-topbar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg lmx-gradient-hero flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <span className="text-ink font-semibold text-[15px]">WorkHub</span>
            <span className="text-ink-subtle text-[13px] ml-2">Agent Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="lmx-btn-accent text-[13px] px-4 py-2"
          >
            + New Ticket
          </button>
          <button onClick={handleLogout} className="lmx-btn-ghost text-[13px] px-3 py-2">
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <p className="lmx-eyebrow mb-1">SUPPORT TICKETS</p>
          <h2 className="text-[28px] font-semibold text-ink tracking-tight">My Tickets</h2>
        </div>

        {/* Ticket list */}
        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="lmx-spinner" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="lmx-section-card-plain">
            <div className="lmx-empty-state">
              <div className="lmx-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/>
                  <path d="M5 5h14a2 2 0 0 1 1.36.51l.01.01A2 2 0 0 1 21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
                </svg>
              </div>
              <h3 className="text-[18px] font-semibold text-ink mb-2">No tickets yet</h3>
              <p className="text-[14px] text-ink-muted mb-6">Create your first support ticket to get started.</p>
              <button onClick={() => setShowCreateForm(true)} className="lmx-btn-accent">
                Create Your First Ticket
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="lmx-section-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[16px] font-semibold text-ink leading-snug">{ticket.title}</h3>
                    <p className="text-[13px] text-ink-muted mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`lmx-chip ${getStatusChipClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`lmx-chip ${getPriorityChipClass(ticket.priority)}`}>
                        <span className="lmx-chip-dot" style={{ background: 'currentColor' }} />
                        {ticket.priority}
                      </span>
                      {ticket.category && (
                        <span className="lmx-chip" style={{ background: 'var(--lmx-surface-chip)', color: 'var(--lmx-ink-muted)' }}>
                          {ticket.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] text-ink-subtle">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="lmx-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}>
          <div className="lmx-modal">
            <div className="flex items-center justify-between pb-5 mb-5" style={{ borderBottom: '1px solid var(--lmx-border)' }}>
              <h3 className="text-[22px] font-semibold text-ink">Create New Ticket</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-1 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label htmlFor="ticket-title" className="lmx-label">Title</label>
                <input
                  id="ticket-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="lmx-input"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div>
                <label htmlFor="ticket-desc" className="lmx-label">Description</label>
                <textarea
                  id="ticket-desc"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="lmx-textarea"
                  rows={4}
                  placeholder="Describe the issue in detail…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ticket-category" className="lmx-label">Category</label>
                  <select
                    id="ticket-category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="lmx-select"
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
                  <label htmlFor="ticket-priority" className="lmx-label">Priority</label>
                  <select
                    id="ticket-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="lmx-select"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--lmx-border)' }}>
                <button type="button" onClick={() => setShowCreateForm(false)} className="lmx-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="lmx-btn-accent">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}