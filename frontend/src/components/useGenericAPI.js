import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

export const useGenericAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (requestFn, successMessage, errorMessage) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestFn();
      
      if (response.data.success) {
        if (successMessage) {
          toast.success(successMessage);
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || errorMessage || 'Operation failed';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic CRUD operations
  const create = useCallback((model, data, successMessage) => {
    return handleRequest(
      () => axiosInstance.post(`/populate/create/${model}`, data),
      successMessage,
      `Failed to create ${model}`
    );
  }, [handleRequest]);

  const read = useCallback((model, options = {}) => {
    const { filter, fields, populateFields, id } = options;
    let url = `/populate/read/${model}`;
    
    if (id) url += `/${id}`;
    
    const params = new URLSearchParams();
    if (filter) params.append('filter', JSON.stringify(filter));
    if (fields) params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    if (populateFields) params.append('populateFields', JSON.stringify(populateFields));
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return handleRequest(
      () => axiosInstance.get(url),
      null,
      `Failed to fetch ${model}`
    );
  }, [handleRequest]);

  const update = useCallback((model, id, data, successMessage) => {
    return handleRequest(
      () => axiosInstance.put(`/populate/update/${model}/${id}`, data),
      successMessage,
      `Failed to update ${model}`
    );
  }, [handleRequest]);

  const remove = useCallback((model, id, successMessage) => {
    return handleRequest(
      () => axiosInstance.delete(`/populate/delete/${model}/${id}`),
      successMessage,
      `Failed to delete ${model}`
    );
  }, [handleRequest]);

  return {
    loading,
    error,
    create,
    read,
    update,
    remove,
    clearError: () => setError(null)
  };
};

export default useGenericAPI;