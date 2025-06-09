import { useLocations } from '@/contexts/LocationsContext';

/**
 * @deprecated Use useLocations from LocationsContext instead
 * This hook is kept for backward compatibility but should be replaced
 */
export function useLocationsSelector() {
  return useLocations();
}

const locationsSelectorHook = {
  useLocationsSelector,
};

export default locationsSelectorHook;
