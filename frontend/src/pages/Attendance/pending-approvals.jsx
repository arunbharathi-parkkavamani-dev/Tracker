import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import TableGenerator from "../../components/Common/TableGenerator";

const PendingApprovals = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch pending leaves
      const leavesRes = await axiosInstance.get('/populate/read/leaves', {
        params: { filter: JSON.stringify({ status: 'Pending' }) }
      });
      
      // Fetch pending regularizations
      const regularizationsRes = await axiosInstance.get('/populate/read/regularizations', {
        params: { filter: JSON.stringify({ status: 'Pending' }) }
      });
      
      const leaves = (leavesRes.data.data || []).map(item => ({
        ...item,
        requestType: 'Leave',
        employeeName: item.employeeName || item.employeeId?.basicInfo?.firstName,
        requestDate: item.startDate
      }));
      
      const regularizations = (regularizationsRes.data.data || []).map(item => ({
        ...item,
        requestType: 'Regularization',
        employeeName: item.employeeId?.basicInfo?.firstName,
        requestDate: item.requestDate
      }));
      
      setPendingRequests([...leaves, ...regularizations]);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const submitAction = async () => {
    try {
      const endpoint = selectedRequest.requestType === 'Leave' 
        ? `/populate/update/leaves/${selectedRequest._id}`
        : `/populate/update/regularizations/${selectedRequest._id}`;
      
      await axiosInstance.put(endpoint, {
        status: actionType === 'approve' ? 'Approved' : 'Rejected',
        approverComment: comment,
        approvedAt: new Date(),
        approvedBy: 'Current User' // Replace with actual user
      });
      
      setShowModal(false);
      setComment("");
      fetchPendingRequests();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const columns = [
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'requestType', label: 'Request Type' },
    { key: 'requestDate', label: 'Request Date', type: 'date' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(row, 'approve')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(row, 'reject')}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Pending Approvals
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Review and approve pending leave and regularization requests
        </p>
      </div>

      <TableGenerator
        data={pendingRequests}
        columns={columns}
        loading={loading}
        emptyMessage="No pending requests found"
      />

      {/* Approval/Rejection Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Request
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Type
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedRequest.requestType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Request Date
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedRequest.requestDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {selectedRequest.requestType === 'Regularization' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Requested Check-In
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.requestedCheckIn}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Requested Check-Out
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.requestedCheckOut}</p>
                    </div>
                  </>
                )}
                {selectedRequest.requestType === 'Leave' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        End Date
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedRequest.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Days
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.totalDays}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason
                </label>
                <p className="text-gray-900 dark:text-white">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Attachments
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {file.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {actionType === 'approve' ? 'Approval' : 'Rejection'} Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder={`Add your ${actionType === 'approve' ? 'approval' : 'rejection'} comment...`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  actionType === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;