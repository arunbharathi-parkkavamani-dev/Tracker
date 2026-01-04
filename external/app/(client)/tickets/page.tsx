'use client';

import { useState } from 'react';
import TicketForm from '../../../components/tickets/TicketForm';
import TicketList from '../../../components/tickets/TicketList';
import TicketView from '../../../components/tickets/TicketView';

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('view');
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('form');
  };

  const refreshTickets = () => {
    setActiveTab('list');
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              Ticket List
            </button>
            <button
              onClick={() => { setActiveTab('form'); setSelectedTicket(null); }}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'form' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
              }`}
            >
              Create Ticket
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <TicketList 
            onViewTicket={handleViewTicket}
            onEditTicket={handleEditTicket}
          />
        )}
        
        {activeTab === 'form' && (
          <TicketForm 
            ticket={selectedTicket}
            onSuccess={refreshTickets}
            onCancel={() => setActiveTab('list')}
          />
        )}
        
        {activeTab === 'view' && selectedTicket && (
          <TicketView 
            ticket={selectedTicket}
            onEdit={() => handleEditTicket(selectedTicket)}
            onBack={() => setActiveTab('list')}
          />
        )}
      </div>
    </div>
  );
}