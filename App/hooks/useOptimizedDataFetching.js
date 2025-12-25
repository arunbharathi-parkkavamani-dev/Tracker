import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useOptimizedAPI from './useOptimizedAPI';

// Simple cache with AsyncStorage fallback for persistence
const memoryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedDataFetching = (model, options = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialFilters = {},
    initialSort = {},
    enableCache = true,
    backgroundRefresh = true,
    cacheKey: customCacheKey
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: initialLimit
  });

  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  
  const { readSummary } = useOptimizedAPI();
  const abortControllerRef = useRef(null);
  const backgroundRefreshRef = useRef(null);

  // Generate cache key
  const getCacheKey = useCallback((page, limit, currentFilters, currentSort) => {
    if (customCacheKey) return customCacheKey;
    return `${model}_${page}_${limit}_${JSON.stringify(currentFilters)}_${JSON.stringify(currentSort)}`;
  }, [model, customCacheKey]);

  // Check if cache is valid
  const isCacheValid = useCallback(async (key) => {
    if (!enableCache) return false;
    
    try {
      // Check memory cache first
      const memoryData = memoryCache.get(key);
      if (memoryData && (Date.now() - memoryData.timestamp) < CACHE_DURATION) {
        return true;
      }
      
      // Check AsyncStorage cache
      const cachedTimestamp = await AsyncStorage.getItem(`${key}_timestamp`);
      if (cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < CACHE_DURATION) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Cache validation error:', error);
      return false;
    }
  }, [enableCache]);

  // Get data from cache
  const getFromCache = useCallback(async (key) => {
    if (!enableCache) return null;
    
    try {
      // Try memory cache first
      const memoryData = memoryCache.get(key);
      if (memoryData && (Date.now() - memoryData.timestamp) < CACHE_DURATION) {
        return memoryData.data;
      }
      
      // Try AsyncStorage cache
      const cachedData = await AsyncStorage.getItem(key);
      const cachedTimestamp = await AsyncStorage.getItem(`${key}_timestamp`);
      
      if (cachedData && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < CACHE_DURATION) {
        const parsedData = JSON.parse(cachedData);
        // Update memory cache
        memoryCache.set(key, { data: parsedData, timestamp: parseInt(cachedTimestamp) });
        return parsedData;
      }
      
      return null;
    } catch (error) {
      console.log('Cache retrieval error:', error);
      return null;
    }
  }, [enableCache]);

  // Set data to cache
  const setToCache = useCallback(async (key, data) => {
    if (!enableCache) return;
    
    try {
      const timestamp = Date.now();
      
      // Set memory cache
      memoryCache.set(key, { data, timestamp });
      
      // Set AsyncStorage cache
      await AsyncStorage.multiSet([
        [key, JSON.stringify(data)],
        [`${key}_timestamp`, timestamp.toString()]
      ]);
    } catch (error) {
      console.log('Cache storage error:', error);
    }
  }, [enableCache]);

  // Fetch data function
  const fetchData = useCallback(async (page, limit, currentFilters, currentSort, useCache = true) => {
    const cacheKey = getCacheKey(page, limit, currentFilters, currentSort);
    
    // Try to get from cache first
    if (useCache) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        setData(cachedData.data);
        setPagination(cachedData.pagination);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await readSummary(model, {
        filter: currentFilters,
        page,
        limit,
        sort: currentSort
      });

      const newData = response.data || [];
      const newPagination = {
        currentPage: page,
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || 0,
        itemsPerPage: limit
      };

      setData(newData);
      setPagination(newPagination);

      // Cache the result
      await setToCache(cacheKey, {
        data: newData,
        pagination: newPagination
      });

      return { data: newData, pagination: newPagination };

    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [model, readSummary, getCacheKey, getFromCache, setToCache]);

  // Initial load
  useEffect(() => {
    fetchData(pagination.currentPage, pagination.itemsPerPage, filters, sort);
  }, []);

  // Background refresh
  useEffect(() => {
    if (!backgroundRefresh) return;

    backgroundRefreshRef.current = setInterval(() => {
      // Only refresh if data is older than half the cache duration
      const cacheKey = getCacheKey(pagination.currentPage, pagination.itemsPerPage, filters, sort);
      
      isCacheValid(cacheKey).then(isValid => {
        if (!isValid) {
          fetchData(pagination.currentPage, pagination.itemsPerPage, filters, sort, false);
        }
      });
    }, CACHE_DURATION / 2);

    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, [backgroundRefresh, pagination.currentPage, pagination.itemsPerPage, filters, sort, fetchData, getCacheKey, isCacheValid]);

  // Page change handler
  const handlePageChange = useCallback((newPage) => {
    fetchData(newPage, pagination.itemsPerPage, filters, sort);
  }, [fetchData, pagination.itemsPerPage, filters, sort]);

  // Items per page change handler
  const handleItemsPerPageChange = useCallback((newLimit) => {
    const newPage = Math.ceil(((pagination.currentPage - 1) * pagination.itemsPerPage + 1) / newLimit);
    fetchData(newPage, newLimit, filters, sort);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage, filters, sort]);

  // Filter change handler
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    fetchData(1, pagination.itemsPerPage, newFilters, sort);
  }, [fetchData, pagination.itemsPerPage, sort]);

  // Sort change handler
  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
    fetchData(pagination.currentPage, pagination.itemsPerPage, filters, newSort);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage, filters]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    // Clear cache for current query
    const cacheKey = getCacheKey(pagination.currentPage, pagination.itemsPerPage, filters, sort);
    memoryCache.delete(cacheKey);
    
    try {
      await AsyncStorage.multiRemove([cacheKey, `${cacheKey}_timestamp`]);
    } catch (error) {
      console.log('Cache clear error:', error);
    }
    
    fetchData(pagination.currentPage, pagination.itemsPerPage, filters, sort, false);
  }, [fetchData, pagination.currentPage, pagination.itemsPerPage, filters, sort, getCacheKey]);

  // Clear cache for this model
  const clearCache = useCallback(async () => {
    try {
      // Clear memory cache
      const keysToDelete = [];
      for (const key of memoryCache.keys()) {
        if (key.startsWith(model)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => memoryCache.delete(key));
      
      // Clear AsyncStorage cache
      const allKeys = await AsyncStorage.getAllKeys();
      const modelKeys = allKeys.filter(key => key.startsWith(model));
      if (modelKeys.length > 0) {
        await AsyncStorage.multiRemove(modelKeys);
      }
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }, [model]);

  return {
    // Data
    data,
    loading,
    error,
    pagination,
    filters,
    sort,
    
    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    handleFilterChange,
    handleSortChange,
    handleRefresh,
    
    // Utilities
    clearCache
  };
};

export default useOptimizedDataFetching;