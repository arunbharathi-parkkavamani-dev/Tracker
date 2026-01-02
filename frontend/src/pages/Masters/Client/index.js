import React, { useState, useEffect } from "react";
import AxiosInstance from "../../../api/axiosInstance";
import TableGenerator from "../../../components/Common/TableGenerator";

const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        contactPerson: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        },
        projectTypes: []
    });

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await AxiosInstance.get('/populate/read/clients');
            setClients(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectTypes = async () => {
        try {
            const response = await AxiosInstance.get('/populate/read/projecttypes');
            setProjectTypes(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching project types:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProjectTypeChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, projectTypes: selectedOptions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await AxiosInstance.put(`/populate/update/clients/${editingClient._id}`, formData);
            } else {
                await AxiosInstance.post('/populate/create/clients', formData);
            }
            setShowModal(false);
            setEditingClient(null);
            resetForm();
            fetchClients();
        } catch (error) {
            console.error("Error saving client:", error);
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            contactPerson: client.contactPerson || '',
            address: {
                street: client.address?.street || '',
                city: client.address?.city || '',
                state: client.address?.state || '',
                zip: client.address?.zip || '',
                country: client.address?.country || ''
            },
            projectTypes: client.projectTypes?.map(pt => pt._id || pt) || []
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            contactPerson: '',
            address: { street: '', city: '', state: '', zip: '', country: '' },
            projectTypes: []
        });
    };

    const openAddModal = () => {
        resetForm();
        setEditingClient(null);
        setShowModal(true);
    };

    useEffect(() => {
        fetchClients();
        fetchProjectTypes();
    }, []);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Client Management</h1>
                <button 
                    onClick={openAddModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <span>+</span> Add New Client
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                <TableGenerator
                    data={clients}
                    loading={loading}
                    entity="clients"
                    onEdit={handleEdit}
                    onRefresh={fetchClients}
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Client Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <h3 className="text-lg font-medium mb-2">Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Street</label>
                                        <input
                                            type="text"
                                            name="address.street"
                                            value={formData.address.street}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">City</label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">State</label>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="address.zip"
                                            value={formData.address.zip}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Country</label>
                                        <input
                                            type="text"
                                            name="address.country"
                                            value={formData.address.country}
                                            onChange={handleInputChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Project Types */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Project Types</label>
                                <select
                                    multiple
                                    value={formData.projectTypes}
                                    onChange={handleProjectTypeChange}
                                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                >
                                    {projectTypes.map(type => (
                                        <option key={type._id} value={type._id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    {editingClient ? 'Update' : 'Create'} Client
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientList;