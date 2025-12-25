import React from 'react';
import {useUserRole} from "../../hooks/useUserRole"

// Employee Expenses Component
const EmployeeExpenses = () => (
  <div className="space-y-4">
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">My Expenses</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-800">Pending</h4>
          <p className="text-2xl font-bold text-blue-600">5</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h4 className="font-medium text-green-800">Approved</h4>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <h4 className="font-medium text-red-800">Rejected</h4>
          <p className="text-2xl font-bold text-red-600">2</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h4 className="font-medium mb-3">Quick Actions</h4>
      <div className="flex flex-col sm:flex-row gap-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Submit Expense
        </button>
        <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          View History
        </button>
      </div>
    </div>
  </div>
);

// Manager Expenses Component
const ManagerExpenses = () => (
  <div className="space-y-4">
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Team Expenses</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded">
          <h4 className="font-medium text-yellow-800 text-sm">Pending Approval</h4>
          <p className="text-2xl font-bold text-yellow-600">8</p>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-800 text-sm">My Expenses</h4>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h4 className="font-medium text-green-800 text-sm">Approved</h4>
          <p className="text-2xl font-bold text-green-600">25</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <h4 className="font-medium text-purple-800 text-sm">Total Amount</h4>
          <p className="text-2xl font-bold text-purple-600">₹45K</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h4 className="font-medium mb-3">Manager Actions</h4>
      <div className="flex flex-col sm:flex-row gap-2">
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Approve Expenses
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Team Reports
        </button>
        <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Submit My Expense
        </button>
      </div>
    </div>
  </div>
);

// HR/Super Admin Expenses Component
const HRExpenses = () => (
  <div className="space-y-4">
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Organization Expenses</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-red-50 p-4 rounded">
          <h4 className="font-medium text-red-800 text-sm">Pending</h4>
          <p className="text-2xl font-bold text-red-600">15</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h4 className="font-medium text-green-800 text-sm">Approved</h4>
          <p className="text-2xl font-bold text-green-600">89</p>
        </div>
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-800 text-sm">This Month</h4>
          <p className="text-2xl font-bold text-blue-600">₹2.5L</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <h4 className="font-medium text-purple-800 text-sm">Budget Used</h4>
          <p className="text-2xl font-bold text-purple-600">65%</p>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <h4 className="font-medium text-orange-800 text-sm">Departments</h4>
          <p className="text-2xl font-bold text-orange-600">8</p>
        </div>
      </div>
    </div>
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <h4 className="font-medium mb-3">HR Actions</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Review All Expenses
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Generate Reports
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Budget Management
        </button>
        <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
          Policy Settings
        </button>
      </div>
    </div>
  </div>
);

// Main Role-Based Expenses Component
const RoleBasedExpenses = () => {
  const { userRole, loading } = useUserRole();

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  const renderExpensesComponent = () => {
    switch (userRole) {
      case 'employee':
        return <EmployeeExpenses />;
      case 'manager':
        return <ManagerExpenses />;
      case 'hr':
      case 'super admin':
        return <HRExpenses />;
      default:
        return <EmployeeExpenses />;
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Travel Expenses</h2>
        <p className="text-gray-600">Role: {userRole}</p>
      </div>
      {renderExpensesComponent()}
    </div>
  );
};

export default RoleBasedExpenses;