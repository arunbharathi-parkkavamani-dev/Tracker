'use client';

import { useState, useRef, useEffect } from 'react';

export default function TicketForm({ ticket, onSuccess, onCancel }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientProducts, setClientProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    product: ticket?.product || '',
    priority: ticket?.priority || 'Medium',
    type: ticket?.type || 'Bug',
    dueDate: ticket?.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
    attachments: []
  });

  // Fetch client products on component mount
  useEffect(() => {
    // For testing, let's use hardcoded products first
    const testProducts = ['Web Application', 'Mobile App', 'API Service', 'Database'];
    console.log('Setting test products:', testProducts);
    setClientProducts(testProducts);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClipboardPaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `pasted-image-${timestamp}.png`, { type: blob.type });
            addFiles([file]);
            setShowAttachmentModal(false);
            return;
          }
        }
      }
      alert('No image found in clipboard');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Failed to paste from clipboard. Please try browsing files instead.');
    }
  };

  const handleModalFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    setShowAttachmentModal(false);
    e.target.value = ''; // Reset input
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/', 'audio/mp3', 'video/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    const files = [];
    
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add agentId to form data
      const agentId = localStorage.getItem('agentId') || 'temp-agent-id';
      formDataToSend.append('agentId', agentId);
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const url = ticket ? `/api/tickets/${ticket._id}` : '/api/tickets';
      const method = ticket ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{ticket ? 'Edit Ticket' : 'Create New Ticket'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onPaste={handlePaste}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the issue or request. You can paste images directly here."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
            {loadingProducts ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                Loading products...
              </div>
            ) : clientProducts.length > 0 ? (
              <select
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                {clientProducts.map((product, index) => (
                  <option key={index} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Enhancement">Enhancement</option>
              <option value="Support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
          <button
            type="button"
            onClick={() => setShowAttachmentModal(true)}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            + Add Attachment
          </button>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (ticket ? 'Update Ticket' : 'Create Ticket')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Attachment Modal */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Attachment</h3>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleClipboardPaste}
                className="w-full py-3 px-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
              >
                📋 Paste from Clipboard
              </button>
              
              <div className="text-center text-gray-500 text-sm">or</div>
              
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleModalFileSelect}
                  multiple
                  accept="image/*,audio/mp3,video/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  📁 Browse Files
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Supported: Images, MP3, Videos, PDF, Word documents (Max 10MB each)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}