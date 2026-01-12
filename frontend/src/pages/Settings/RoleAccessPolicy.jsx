import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/solid';

const RoleAccessPolicy = () => {
    const [roles, setRoles] = useState([]);
    const [models, setModels] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [policies, setPolicies] = useState({}); // modelName -> { read: bool, create: bool... }
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Initial Data Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, modelsRes] = await Promise.all([
                    axiosInstance.get('/populate/read/roles'),
                    axiosInstance.get('/config/models')
                ]);
                setRoles(rolesRes.data.data || []);
                setModels(modelsRes.data.models || []);
            } catch (err) {
                console.error("Failed to load setup data", err);
            }
        };
        fetchData();
    }, []);

    // Load Policies when Role Selected
    useEffect(() => {
        if (!selectedRole) return;

        const fetchPolicies = async () => {
            setLoading(true);
            try {
                const res = await axiosInstance.get(`/populate/read/accesspolicies`, {
                    params: {
                        filter: JSON.stringify({ role: selectedRole }),
                        limit: 1000
                    }
                });

                const policyMap = {};
                res.data.data.forEach(p => {
                    policyMap[p.modelName] = p.permissions;
                });
                setPolicies(policyMap);
            } catch (err) {
                console.error("Failed to load policies", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicies();
    }, [selectedRole]);

    // Handle Toggle
    const handleToggle = (model, type) => {
        setPolicies(prev => {
            const current = prev[model]?.[type] || false;
            return {
                ...prev,
                [model]: {
                    ...prev[model],
                    [type]: !current
                }
            };
        });
    };

    // Bulk Save
    const handleSave = async () => {
        setMessage('Saving...');
        try {
            // Prepare Bulk Payload
            // We only send models that have at least one permission set OR exist in policies map
            // Effectively we sync the state to backend.

            const bulkPayload = models.map(model => {
                const perms = policies[model] || { read: false, create: false, update: false, delete: false };
                return {
                    filter: { role: selectedRole, modelName: model },
                    body: { permissions: perms }
                };
            });

            // Use the new Bulk Upsert Endpoint
            const res = await axiosInstance.post(`/populate/bulk-upsert/accesspolicies`, bulkPayload);

            if (res.data.success) {
                setMessage(`Saved! Updated: ${res.data.count}`);
                if (res.data.errors) {
                    console.error("Some updates failed", res.data.errors);
                    alert("Partial success. Check console for details.");
                }
            } else {
                setMessage('Save Failed');
            }

        } catch (err) {
            console.error(err);
            setMessage('Error saving policies');
        }
    };

    const handleRefreshCache = async () => {
        try {
            await axiosInstance.post('/config/refresh-policy');
            alert('Cache Refreshed!');
        } catch (e) {
            alert('Refresh Failed');
        }
    };

    // Modern Toggle Button Component
    const ToggleButton = ({ active, onClick }) => (
        <button
            onClick={onClick}
            className={`
            relative w-16 h-8 rounded-full transition-colors duration-200 focus:outline-none flex items-center px-1
            ${active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
        `}
        >
            <span
                className={`
                block w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200
                ${active ? 'translate-x-8' : 'translate-x-0'}
            `}
            />
            {/* Optional Icon/Text inside */}
        </button>
    );

    // Or even better, a "Chip" style button as requested ("button type check box")
    const PermissionChip = ({ active, onClick, label }) => (
        <button
            onClick={onClick}
            className={`
            px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 border
            ${active
                    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700 hover:bg-green-200'
                    : 'bg-white text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 hover:bg-gray-50'}
        `}
        >
            {active ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
            {label}
        </button>
    );

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-bold dark:text-white">Role Access Policy</h2>
                </div>
                <button
                    onClick={handleRefreshCache}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Refresh System Cache
                </button>
            </div>

            {/* Role Selector */}
            <div className="mb-6 max-w-md">
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Select Role to Configure</label>
                <div className="relative">
                    <select
                        className="w-full p-3 pl-4 bg-gray-50 border border-gray-300 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value)}
                    >
                        <option value="">-- Choose a Role --</option>
                        {roles.map(r => (
                            <option key={r._id} value={r._id}>{r.roleName}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Permissions Grid */}
            {selectedRole ? (
                <>
                    <div className="flex-1 overflow-auto rounded-lg border dark:border-gray-700">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-200 uppercase text-xs tracking-wider">Model Name</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-200 uppercase text-xs tracking-wider text-center">Read</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-200 uppercase text-xs tracking-wider text-center">Create</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-200 uppercase text-xs tracking-wider text-center">Update</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-200 uppercase text-xs tracking-wider text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {models.map(model => (
                                    <tr key={model} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                                            {model.charAt(0).toUpperCase() + model.slice(1)}
                                        </td>
                                        {['read', 'create', 'update', 'delete'].map(type => (
                                            <td key={type} className="p-2 text-center">
                                                <div className="flex justify-center">
                                                    <PermissionChip
                                                        active={policies[model]?.[type] || false}
                                                        onClick={() => handleToggle(model, type)}
                                                        label={type.toUpperCase()}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end items-center gap-6 border-t pt-6 bg-white dark:bg-gray-800">
                        {message && (
                            <div className={`text-sm font-medium animate-pulse ${message.includes('Error') || message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            className={`
                        px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform active:scale-95 transition-all
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
                    <ShieldCheckIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a Role to view and edit policies</p>
                </div>
            )}
        </div>
    );
};

export default RoleAccessPolicy;
