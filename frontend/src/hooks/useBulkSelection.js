import { useState, useCallback } from 'react';

/**
 * Hook for managing bulk selection state
 * @param {Array} items - Array of items to select from
 * @param {string} idKey - Key to use as unique identifier (default: 'id')
 */
export function useBulkSelection(items = [], idKey = 'id') {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleItem = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item[idKey])));
  }, [items, idKey]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const selectedItems = items.filter(item => selectedIds.has(item[idKey]));

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectedItems,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
  };
}

