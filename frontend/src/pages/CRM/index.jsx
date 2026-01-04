import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

const CRM = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeLeads: 0,
    completedMilestones: 0,
    pendingTasks: 0
  });

  const fetchStats = async () => {
    try {
      const [clientsRes, tasksRes] = await Promise.all([
        axiosInstance.get("/populate/read/clients?limit=1000"),
        axiosInstance.get("/populate/read/tasks?limit=1000")
      ]);

      const clients = clientsRes.data?.data || [];
      const tasks = tasksRes.data?.data || [];

      setStats({
        totalClients: clients.length,
        activeLeads: clients.filter(c => c.leadStatus !== 'Closed Won' && c.leadStatus !== 'Closed Lost').length,
        completedMilestones: clients.reduce((acc, c) => 
          acc + (c.milestones?.filter(m => m.status === 'Completed').length || 0), 0),
        pendingTasks: tasks.filter(t => t.status !== 'Completed').length
      });
    } catch (err) {
      console.error("Error fetching CRM stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-6">CRM Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Clients</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalClients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Active Leads</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeLeads}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Completed Milestones</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.completedMilestones}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pending Tasks</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingTasks}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/crm/contacts" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100">
            <div className="text-blue-600 font-semibold">Manage Contacts</div>
            <div className="text-sm text-gray-600">View and update client information</div>
          </a>
          
          <a href="/crm/leads" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100">
            <div className="text-green-600 font-semibold">Track Leads</div>
            <div className="text-sm text-gray-600">Monitor lead progression</div>
          </a>
          
          <a href="/crm/tasks" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100">
            <div className="text-purple-600 font-semibold">Milestone Tasks</div>
            <div className="text-sm text-gray-600">Manage milestone-based tasks</div>
          </a>
          
          <a href="/crm/reports" className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100">
            <div className="text-orange-600 font-semibold">View Reports</div>
            <div className="text-sm text-gray-600">Generate CRM analytics</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CRM;