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
            className="px-3 py-1.5 text-[13px] font-medium bg-white border border-[#d3cec6] text-[#111111] rounded-[6px] hover:bg-[#0bdf50]/10 hover:text-[#0bdf50] hover:border-[#0bdf50]/30 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(row, 'reject')}
            className="px-3 py-1.5 text-[13px] font-medium bg-white border border-[#d3cec6] text-[#111111] rounded-[6px] hover:bg-[#c41c1c]/10 hover:text-[#c41c1c] hover:border-[#c41c1c]/30 transition-colors"
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 bg-[#f5f1ec] min-h-screen" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div className="mb-6">
        <h1 className="text-[24px] font-medium text-[#111111] tracking-[-0.3px]">
          Pending Approvals
        </h1>
        <p className="text-[14px] text-[#626260] mt-1">
          Review and approve pending leave and regularization requests
        </p>
      </div>

      {!showModal && (
        <div className="bg-white border border-[#d3cec6] rounded-[16px] shadow-sm overflow-hidden">
          <TableGenerator
            data={pendingRequests}
            columns={columns}
            loading={loading}
            emptyMessage="No pending requests found"
          />
        </div>
      )}

      {/* Approval/Rejection Page View */}
      {showModal && selectedRequest && (
        <div className="bg-white rounded-[16px] p-6 w-full max-w-3xl mx-auto shadow-sm border border-[#d3cec6]" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
          <div className="flex items-center gap-4 mb-8 border-b border-[#ebe7e1] pb-5">
            <button
              onClick={() => setShowModal(false)}
              className="p-2 rounded-[8px] hover:bg-[#f5f1ec] text-[#626260] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="text-[20px] font-medium text-[#111111]">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Request
            </h2>
          </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-medium text-[#626260] mb-1">
                    Employee Name
                  </label>
                  <p className="text-[14px] text-[#111111]">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#626260] mb-1">
                    Request Type
                  </label>
                  <p className="text-[14px] text-[#111111]">{selectedRequest.requestType}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#626260] mb-1">
                    Request Date
                  </label>
                  <p className="text-[14px] text-[#111111]">
                    {new Date(selectedRequest.requestDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {selectedRequest.requestType === 'Regularization' && (
                  <>
                    <div>
                      <label className="block text-[12px] font-medium text-[#626260] mb-1">
                        Requested Check-In
                      </label>
                      <p className="text-[14px] text-[#111111]">{selectedRequest.requestedCheckIn}</p>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#626260] mb-1">
                        Requested Check-Out
                      </label>
                      <p className="text-[14px] text-[#111111]">{selectedRequest.requestedCheckOut}</p>
                    </div>
                  </>
                )}
                {selectedRequest.requestType === 'Leave' && (
                  <>
                    <div>
                      <label className="block text-[12px] font-medium text-[#626260] mb-1">
                        End Date
                      </label>
                      <p className="text-[14px] text-[#111111]">
                        {new Date(selectedRequest.endDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#626260] mb-1">
                        Total Days
                      </label>
                      <p className="text-[14px] text-[#111111]">{selectedRequest.totalDays}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-[#f5f1ec] p-4 rounded-[8px]">
                <label className="block text-[12px] font-medium text-[#626260] mb-1">
                  Reason
                </label>
                <p className="text-[14px] text-[#111111]">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <label className="block text-[12px] font-medium text-[#626260] mb-2">
                    Attachments
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#111111] hover:underline text-[13px] font-medium bg-[#f5f1ec] px-3 py-1.5 rounded-[6px]"
                      >
                        {file.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-[#626260] mb-2">
                  {actionType === 'approve' ? 'Approval' : 'Rejection'} Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 text-[14px] text-[#111111] bg-white border border-[#d3cec6] rounded-[8px] focus:ring-1 focus:ring-[#111111] focus:border-[#111111] outline-none transition-shadow"
                  rows="3"
                  placeholder={`Add your ${actionType === 'approve' ? 'approval' : 'rejection'} comment...`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-[14px] font-medium text-[#111111] bg-white border border-[#d3cec6] rounded-[8px] hover:bg-[#f5f1ec] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className={`px-5 py-2.5 text-[14px] font-medium text-white rounded-[8px] cursor-pointer transition-colors ${
                  actionType === 'approve'
                    ? 'bg-[#111111] hover:bg-[#313130]'
                    : 'bg-[#c41c1c] hover:bg-[#a61616]'
                }`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default PendingApprovals;