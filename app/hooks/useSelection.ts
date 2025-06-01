import { useState, useCallback, useMemo, useRef } from 'react';

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

  // Cache para evitar recalcular keyExtractor
  const itemKeysMapRef = useRef(new Map<T, string>());

  // Função otimizada para obter chave do item
  const getItemKey = useCallback(
    (item: T): string => {
      if (!itemKeysMapRef.current.has(item)) {
        itemKeysMapRef.current.set(item, keyExtractor(item));
      }
      return itemKeysMapRef.current.get(item)!;
    },
    [keyExtractor]
  );

  // Limpar cache quando items mudam
  const itemsRef = useRef(items);
  if (itemsRef.current !== items) {
    itemKeysMapRef.current.clear();
    itemsRef.current = items;
  }

  // Itens selecionados memoizados
  const selectedItems = useMemo(() => {
    if (selectedIds.size === 0) return [];

    return items.filter((item) => selectedIds.has(getItemKey(item)));
  }, [items, selectedIds, getItemKey]);

  // Verificar se um item está selecionado
  const isSelected = useCallback(
    (item: T) => selectedIds.has(getItemKey(item)),
    [selectedIds, getItemKey]
  );

  // Alternar seleção de um item
  const toggleSelection = useCallback(
    (item: T) => {
      const id = getItemKey(item);

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

        return newSet;
      });
    },
    [getItemKey, isSelectionMode]
  );

  // Callback de mudança otimizado
  const notifySelectionChange = useCallback(() => {
    if (onSelectionChange) {
      const selected = items.filter((item) => selectedIds.has(getItemKey(item)));
      onSelectionChange(selected);
    }
  }, [items, selectedIds, getItemKey, onSelectionChange]);

  // Chamar callback quando seleção muda
  const prevSelectedCountRef = useRef(selectedIds.size);
  if (prevSelectedCountRef.current !== selectedIds.size) {
    prevSelectedCountRef.current = selectedIds.size;
    notifySelectionChange();
  }

  // Selecionar todos os itens
  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemKey));
    setSelectedIds(allIds);
    setIsSelectionMode(true);
  }, [items, getItemKey]);

  // Desselecionar todos os itens
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  // Alternar seleção de todos
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length && items.length > 0) {
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

  // Calcular isAllSelected de forma otimizada
  const isAllSelected = useMemo(() => {
    return selectedIds.size === items.length && items.length > 0;
  }, [selectedIds.size, items.length]);

  return {
    // Estado
    selectedIds,
    selectedItems,
    isSelectionMode,
    selectionCount: selectedIds.size,
    isAllSelected,

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
