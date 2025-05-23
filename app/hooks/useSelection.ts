import { useState, useCallback, useMemo } from 'react';

interface UseSelectionOptions<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onSelectionChange?: (selectedItems: T[]) => void;
}

export function useSelection<T>({
  items,
  keyExtractor,
  onSelectionChange,
}: UseSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Itens selecionados
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(keyExtractor(item)));
  }, [items, selectedIds, keyExtractor]);

  // Verificar se um item está selecionado
  const isSelected = useCallback(
    (item: T) => {
      return selectedIds.has(keyExtractor(item));
    },
    [selectedIds, keyExtractor]
  );

  // Alternar seleção de um item
  const toggleSelection = useCallback(
    (item: T) => {
      const id = keyExtractor(item);
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
          // Ativar modo de seleção ao selecionar primeiro item
          if (!isSelectionMode) {
            setIsSelectionMode(true);
          }
        }

        // Desativar modo de seleção se não houver mais itens
        if (newSet.size === 0) {
          setIsSelectionMode(false);
        }

        // Callback de mudança
        if (onSelectionChange) {
          const selected = items.filter((item) => newSet.has(keyExtractor(item)));
          onSelectionChange(selected);
        }

        return newSet;
      });
    },
    [keyExtractor, isSelectionMode, items, onSelectionChange]
  );

  // Selecionar todos os itens
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(keyExtractor));
    setSelectedIds(allIds);
    setIsSelectionMode(true);

    if (onSelectionChange) {
      onSelectionChange(items);
    }
  }, [items, keyExtractor, onSelectionChange]);

  // Desselecionar todos os itens
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);

    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }, [onSelectionChange]);

  // Alternar seleção de todos
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, clearSelection, selectAll]);

  // Entrar no modo de seleção
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  // Sair do modo de seleção
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    clearSelection();
  }, [clearSelection]);

  // Manipular long press
  const handleLongPress = useCallback(
    (item: T) => {
      if (!isSelectionMode) {
        enterSelectionMode();
        toggleSelection(item);
      }
    },
    [isSelectionMode, enterSelectionMode, toggleSelection]
  );

  // Manipular press normal
  const handlePress = useCallback(
    (item: T, onItemPress?: (item: T) => void) => {
      if (isSelectionMode) {
        toggleSelection(item);
      } else if (onItemPress) {
        onItemPress(item);
      }
    },
    [isSelectionMode, toggleSelection]
  );

  return {
    // Estado
    selectedIds,
    selectedItems,
    isSelectionMode,
    selectionCount: selectedIds.size,
    isAllSelected: selectedIds.size === items.length && items.length > 0,

    // Métodos
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    enterSelectionMode,
    exitSelectionMode,
    handleLongPress,
    handlePress,
  };
}

export default useSelection;
