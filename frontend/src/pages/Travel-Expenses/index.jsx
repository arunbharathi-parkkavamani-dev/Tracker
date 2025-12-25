import { useState, useEffect } from "react";
import { useAuth } from "../../context/authProvider";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { RoleBasedExpenses } from "../../components/role";

const ExpenseTracker = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state for daily entries
  const [dailyEntries, setDailyEntries] = useState([{
    clientId: "",
    date: new Date().toISOString().split('T')[0],
    expenses: [{
      expenseType: "travel",
      amount: "",
      description: ""
    }]
  }]);
  
  const [files, setFiles] = useState([]);

  const expenseTypes = [
    { value: "travel", label: "Travel" },
    { value: "accommodation", label: "Accommodation" },
    { value: "miscellaneous", label: "Miscellaneous" },
    { value: "food", label: "Food" }
  ];

  useEffect(() => {
    fetchExpenses();
    fetchClients();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axiosInstance.get("/expenses");
      setExpenses(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch expenses");
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get("/populate/read/clients");
      setClients(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch clients");
    }
  };

  const addDayEntry = () => {
    setDailyEntries([...dailyEntries, {
      clientId: "",
      date: new Date().toISOString().split('T')[0],
      expenses: [{
        expenseType: "travel",
        amount: "",
        description: ""
      }]
    }]);
  };

  const removeDayEntry = (dayIndex) => {
    setDailyEntries(dailyEntries.filter((_, i) => i !== dayIndex));
  };

  const addExpenseToDay = (dayIndex) => {
    const updated = [...dailyEntries];
    updated[dayIndex].expenses.push({
      expenseType: "travel",
      amount: "",
      description: ""
    });
    setDailyEntries(updated);
  };

  const removeExpenseFromDay = (dayIndex, expenseIndex) => {
    const updated = [...dailyEntries];
    updated[dayIndex].expenses = updated[dayIndex].expenses.filter((_, i) => i !== expenseIndex);
    setDailyEntries(updated);
  };

  const updateDayEntry = (dayIndex, field, value) => {
    const updated = [...dailyEntries];
    updated[dayIndex][field] = value;
    setDailyEntries(updated);
  };

  const updateExpenseEntry = (dayIndex, expenseIndex, field, value) => {
    const updated = [...dailyEntries];
    updated[dayIndex].expenses[expenseIndex][field] = value;
    setDailyEntries(updated);
  };

  const submitExpenses = async () => {
    try {
      setLoading(true);
      
      for (const dayEntry of dailyEntries) {
        const formData = new FormData();
        formData.append('clientId', dayEntry.clientId);
        formData.append('date', dayEntry.date);
        formData.append('expenses', JSON.stringify(dayEntry.expenses));
        
        files.forEach(file => {
          formData.append('files', file);
        });
        
        await axiosInstance.post("/expenses/daily", formData);
      }
      
      toast.success("Expenses submitted successfully!");
      setShowForm(false);
      setDailyEntries([{
        clientId: "",
        date: new Date().toISOString().split('T')[0],
        expenses: [{
          expenseType: "travel",
          amount: "",
          description: ""
        }]
      }]);
      setFiles([]);
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit expenses");
    } finally {
      setLoading(false);
    }
  };

  const getDayTotal = (dayIndex) => {
    return dailyEntries[dayIndex].expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role-based Header Component */}
      <RoleBasedExpenses />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Expense Details</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Expenses
          </button>
        </div>

        {/* Expense List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">My Expenses</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.clientId?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.totalExpenses} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{expense.dayTotal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                        expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Add Daily Expenses</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Daily Entries */}
                {dailyEntries.map((dayEntry, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Day {dayIndex + 1} - Total: ₹{getDayTotal(dayIndex)}</h3>
                      {dailyEntries.length > 1 && (
                        <button
                          onClick={() => removeDayEntry(dayIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Day Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <select
                          value={dayEntry.clientId}
                          onChange={(e) => updateDayEntry(dayIndex, 'clientId', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        >
                          <option value="">Select Client</option>
                          {clients.map(client => (
                            <option key={client._id} value={client._id}>{client.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={dayEntry.date}
                          onChange={(e) => updateDayEntry(dayIndex, 'date', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                    </div>

                    {/* Expenses for this day */}
                    <div className="space-y-3">
                      {dayEntry.expenses.map((expense, expenseIndex) => (
                        <div key={expenseIndex} className="bg-gray-50 p-3 rounded relative">
                          {dayEntry.expenses.length > 1 && (
                            <button
                              onClick={() => removeExpenseFromDay(dayIndex, expenseIndex)}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={expense.expenseType}
                                onChange={(e) => updateExpenseEntry(dayIndex, expenseIndex, 'expenseType', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                {expenseTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                              <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) => updateExpenseEntry(dayIndex, expenseIndex, 'amount', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                              <input
                                type="text"
                                value={expense.description}
                                onChange={(e) => updateExpenseEntry(dayIndex, expenseIndex, 'description', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="Description..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add expense to day */}
                      <button
                        onClick={() => addExpenseToDay(dayIndex)}
                        className="w-full border border-dashed border-gray-300 rounded p-2 text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add Expense to Day
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Another Day */}
                <button
                  onClick={addDayEntry}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Day
                </button>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitExpenses}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : `Submit ${dailyEntries.length} Day(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;