import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOptimizedDataFetching } from '../../hooks/useOptimizedDataFetching';

const OptimizedList = ({
  model,
  renderItem,
  keyExtractor = (item) => item._id || item.id,
  title,
  searchable = true,
  refreshable = true,
  pagination = true,
  itemsPerPage = 20,
  filters = {},
  sort = { createdAt: -1 },
  onItemPress,
  emptyMessage = 'No items found',
  style,
  contentContainerStyle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const {
    data,
    loading,
    error,
    pagination: paginationInfo,
    handlePageChange,
    handleFilterChange,
    handleRefresh
  } = useOptimizedDataFetching(model, {
    initialLimit: itemsPerPage,
    initialFilters: filters,
    initialSort: sort,
    enableCache: true,
    backgroundRefresh: true
  });

  // Handle search with debouncing
  const handleSearch = useCallback((text) => {
    setSearchTerm(text);

    const searchFilters = text ? {
      ...filters,
      $or: [
        { name: { $regex: text, $options: 'i' } },
        { title: { $regex: text, $options: 'i' } },
        { description: { $regex: text, $options: 'i' } }
      ]
    } : filters;

    handleFilterChange(searchFilters);
  }, [filters, handleFilterChange]);

  // Load more data for pagination
  const handleLoadMore = useCallback(() => {
    if (!loading && paginationInfo.currentPage < paginationInfo.totalPages) {
      handlePageChange(paginationInfo.currentPage + 1);
    }
  }, [loading, paginationInfo, handlePageChange]);

  // Enhanced render item with press handling
  const enhancedRenderItem = useCallback(({ item, index }) => {
    const itemComponent = renderItem({ item, index });

    if (onItemPress) {
      return (
        <TouchableOpacity onPress={() => onItemPress(item)} activeOpacity={0.7}>
          {itemComponent}
        </TouchableOpacity>
      );
    }

    return itemComponent;
  }, [renderItem, onItemPress]);

  // Footer component for pagination
  const renderFooter = useCallback(() => {
    if (!pagination || paginationInfo.currentPage >= paginationInfo.totalPages) {
      return null;
    }

    return (
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [loading, pagination, paginationInfo, handleLoadMore]);

  // Empty component
  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-outline" size={48} color="#8E8E93" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }, [loading, error, emptyMessage, handleRefresh]);

  // Header component with search
  const renderHeader = useMemo(() => {
    if (!title && !searchable) return null;

    return (
      <View style={styles.header}>
        {title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {paginationInfo.totalItems > 0 && (
              <Text style={styles.count}>({paginationInfo.totalItems})</Text>
            )}
          </View>
        )}

        {searchable && (
          <View style={styles.searchContainer}>
            {showSearch ? (
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchTerm}
                  onChangeText={handleSearch}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setShowSearch(false);
                    setSearchTerm('');
                    handleSearch('');
                  }}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }, [title, searchable, showSearch, searchTerm, paginationInfo.totalItems, handleSearch]);

  return (
    <View style={[styles.container, style]}>
      {renderHeader}
      <FlatList
        data={data}
        renderItem={enhancedRenderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          refreshable ? (
            <RefreshControl
              refreshing={loading && paginationInfo.currentPage === 1}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={pagination ? handleLoadMore : undefined}
        onEndReachedThreshold={0.1}
        contentContainerStyle={[
          data.length === 0 && styles.emptyContainer,
          contentContainerStyle
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF'
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000'
  },
  count: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8
  },
  searchContainer: {
    alignItems: 'flex-end'
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: '100%'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000'
  },
  cancelButton: {
    padding: 4
  },
  searchButton: {
    padding: 8
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93'
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center'
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8
  },
  loadMoreText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  emptyContainer: {
    flexGrow: 1
  }
});

export default OptimizedList;