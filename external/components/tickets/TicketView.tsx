'use client';

import { useState, useEffect } from 'react';

export default function TicketView({ ticket, onEdit, onBack }) {
  const [liveHours, setLiveHours] = useState(ticket.liveHours || 0);

  useEffect(() => {
    if (ticket.status !== 'Completed') {
      const interval = setInterval(() => {
        const startTime = new Date(ticket.startDate || ticket.createdAt);
        const currentTime = new Date();
        const diffInHours = Math.floor((currentTime - startTime) / (1000 * 60 * 60));
        setLiveHours(diffInHours);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [ticket]);

  const getStatusColor = (status) => {
    const colors = {
      'Task Viewed': 'bg-blue-100 text-blue-800',
      'Reviewed': 'bg-yellow-100 text-yellow-800',
      'Moved to Development': 'bg-purple-100 text-purple-800',
      'Waiting For approval': 'bg-orange-100 text-orange-800',
      'Updated In staging': 'bg-indigo-100 text-indigo-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Critical': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return '🖼️';
    if (mimetype?.startsWith('video/')) return '🎥';
    if (mimetype?.startsWith('audio/')) return '🎵';
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Ticket ID: {ticket.ticketId}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Product</label>
                <p className="text-sm text-gray-900">{ticket.product}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-900">{ticket.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Priority</label>
                <p className={`text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline & Assignment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Account Manager</label>
                <p className="text-sm text-gray-900">{ticket.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Start Date</label>
                <p className="text-sm text-gray-900">
                  {ticket.startDate ? new Date(ticket.startDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Due Date</label>
                <p className="text-sm text-gray-900">
                  {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Live Hours</label>
                <p className="text-sm text-gray-900 font-semibold">{liveHours} hours</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Description (User Story)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ticket.attachments.map((attachment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(attachment.mimetype)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.originalName || attachment.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {attachment.path && (
                    <a
                      href={`/api/tickets/attachment/${attachment.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Created By</label>
            <p className="text-sm text-gray-900">{ticket.createdBy?.name || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Created At</label>
            <p className="text-sm text-gray-900">
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}