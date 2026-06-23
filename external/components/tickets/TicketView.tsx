'use client';

import { useState, useEffect } from 'react';

export default function TicketView({ ticket, onEdit, onBack }: any) {
  const [liveHours, setLiveHours] = useState(ticket.liveHours || 0);

  useEffect(() => {
    if (ticket.status !== 'Completed') {
      const startTime = new Date(ticket.startDate || ticket.createdAt);
      const currentTime = new Date();
      setLiveHours(Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));

      const interval = setInterval(() => {
        const now = new Date();
        setLiveHours(Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60)));
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [ticket]);

  const getStatusChipClass = (status: string) => {
    const map: Record<string, string> = {
      'Task Viewed': 'lmx-chip-inprogress',
      'Reviewed': 'lmx-chip-pending',
      'Moved to Development': 'lmx-chip-inprogress',
      'Waiting For approval': 'lmx-chip-pending',
      'Updated In staging': 'lmx-chip-inprogress',
      'Completed': 'lmx-chip-active',
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

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.startsWith('image/')) return '🖼️';
    if (mimetype?.startsWith('video/')) return '🎥';
    if (mimetype?.startsWith('audio/')) return '🎵';
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="lmx-section-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="lmx-eyebrow mb-1">TICKET DETAILS</p>
            <h2 className="text-[22px] font-semibold text-ink leading-tight">{ticket.title}</h2>
            <p className="text-[13px] text-ink-subtle mt-1">ID: {ticket.ticketId}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit} className="lmx-btn-accent text-[13px] px-4 py-2">
              Edit
            </button>
            <button onClick={onBack} className="lmx-btn-secondary text-[13px] px-4 py-2">
              Back to List
            </button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ticket Details */}
        <div className="lmx-section-card">
          <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--lmx-border-soft)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lmx-accent-light)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3 className="text-[18px] font-semibold text-ink">Ticket Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="lmx-label">Product</span>
              <p className="text-[14px] text-ink">{ticket.product || '—'}</p>
            </div>
            <div>
              <span className="lmx-label">Type</span>
              <p className="text-[14px] text-ink">{ticket.type || '—'}</p>
            </div>
            <div>
              <span className="lmx-label">Priority</span>
              <span className={`lmx-chip ${getPriorityChipClass(ticket.priority)}`}>
                <span className="lmx-chip-dot" style={{ background: 'currentColor' }} />
                {ticket.priority}
              </span>
            </div>
            <div>
              <span className="lmx-label">Status</span>
              <span className={`lmx-chip ${getStatusChipClass(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline & Assignment */}
        <div className="lmx-section-card">
          <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--lmx-border-soft)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lmx-accent-light)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 className="text-[18px] font-semibold text-ink">Timeline & Assignment</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="lmx-label">Account Manager</span>
              <p className="text-[14px] text-ink">{ticket.assignedTo?.name || '—'}</p>
            </div>
            <div>
              <span className="lmx-label">Start Date</span>
              <p className="text-[14px] text-ink">
                {ticket.startDate ? new Date(ticket.startDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <span className="lmx-label">Due Date</span>
              <p className="text-[14px] text-ink">
                {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <span className="lmx-label">Live Hours</span>
              <p className="text-[14px] font-semibold text-ink">{liveHours} hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="lmx-section-card">
        <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--lmx-border-soft)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lmx-accent-light)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
          </div>
          <h3 className="text-[18px] font-semibold text-ink">Description (User Story)</h3>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--lmx-surface-1)' }}>
          <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">
            {ticket.description || '—'}
          </p>
        </div>
      </div>

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="lmx-section-card">
          <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--lmx-border-soft)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--lmx-accent-light)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lmx-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </div>
            <h3 className="text-[18px] font-semibold text-ink">Attachments</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ticket.attachments.map((attachment: any, index: number) => (
              <div key={index} className="rounded-lg p-3 flex items-center gap-3" style={{ border: '1px solid var(--lmx-border)', background: 'var(--lmx-surface-0)' }}>
                <span className="text-[22px]">{getFileIcon(attachment.mimetype)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">
                    {attachment.originalName || attachment.filename}
                  </p>
                  <p className="text-[11px] text-ink-subtle">
                    {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    {attachment.uploadedAt ? ` · ${new Date(attachment.uploadedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                {attachment.path && (
                  <a
                    href={`/api/tickets/attachment/${attachment.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lmx-btn-ghost text-[11px] px-2 py-1 shrink-0"
                    style={{ color: 'var(--lmx-accent)' }}
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="lmx-section-card-plain px-5 py-4">
          <span className="lmx-label">Created By</span>
          <p className="text-[14px] text-ink">{ticket.createdBy?.name || '—'}</p>
        </div>
        <div className="lmx-section-card-plain px-5 py-4">
          <span className="lmx-label">Created At</span>
          <p className="text-[14px] text-ink">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}