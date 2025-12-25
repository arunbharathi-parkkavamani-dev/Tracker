import { useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

export const useOptimizedAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = useCallback(async (requestFn, successMessage) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestFn();
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Operation failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced read operation with pagination and optimization support
  const read = useCallback((model, options = {}) => {
    const { 
      filter, 
      fields, 
      populateFields, 
      id, 
      page = 1, 
      limit = 10, 
      sort,
      type, // 1=summary, 2=detailed, 3=statistics
      stages // for aggregation
    } = options;
    
    let url = `/populate/read/${model}`;
    
    if (id) url += `/${id}`;
    
    const params = new URLSearchParams();
    
    // Add pagination parameters
    if (!id) {
      params.append('page', page.toString());
      params.append('limit', limit.toString());
    }
    
    // Add query parameters
    if (filter) params.append('filter', JSON.stringify(filter));
    if (fields) params.append('fields', Array.isArray(fields) ? fields.join(',') : fields);
    if (populateFields) params.append('populateFields', JSON.stringify(populateFields));
    if (sort) params.append('sort', JSON.stringify(sort));
    if (type) params.append('type', type.toString());
    if (stages) params.append('stages', JSON.stringify(stages));
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return handleRequest(
      () => axiosInstance.get(url),
      null
    );
  }, [handleRequest]);

  // Summary read - optimized for list views
  const readSummary = useCallback((model, options = {}) => {
    return read(model, { ...options, type: 1 });
  }, [read]);

  // Detailed read - for single item views
  const readDetailed = useCallback((model, options = {}) => {
    return read(model, { ...options, type: 2 });
  }, [read]);

  // Statistics read - for dashboard/analytics
  const readStatistics = useCallback((model, options = {}) => {
    return read(model, { ...options, type: 3 });
  }, [read]);

  // Paginated read with built-in pagination support
  const readPaginated = useCallback((model, page = 1, limit = 10, options = {}) => {
    return read(model, { ...options, page, limit, type: 1 });
  }, [read]);

  // Enhanced create with file upload support
  const create = useCallback((model, data, options = {}) => {
    const { isFormData = false } = options;
    
    return handleRequest(
      () => {
        const config = isFormData ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : {};
        return axiosInstance.post(`/populate/create/${model}`, data, config);
      }
    );
  }, [handleRequest]);

  // Enhanced update with file upload support
  const update = useCallback((model, id, data, options = {}) => {
    const { isFormData = false } = options;
    
    return handleRequest(
      () => {
        const config = isFormData ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : {};
        return axiosInstance.put(`/populate/update/${model}/${id}`, data, config);
      }
    );
  }, [handleRequest]);

  const remove = useCallback((model, id) => {
    return handleRequest(
      () => axiosInstance.delete(`/populate/delete/${model}/${id}`)
    );
  }, [handleRequest]);

  return {
    loading,
    error,
    // Basic CRUD
    create,
    read,
    update,
    remove,
    // Enhanced read operations
    readSummary,
    readDetailed,
    readStatistics,
    readPaginated,
    // Utility
    clearError: () => setError(null)
  };
};

export default useOptimizedAPI;