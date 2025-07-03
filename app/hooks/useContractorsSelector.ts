import { useContractors } from '../contexts/ContractorsContext';

/**
 * @deprecated Use useContractors from ContractorsContext instead
 * This hook is kept for backward compatibility but should be replaced
 */
export function useContractorsSelector() {
  return useContractors();
}

const contractorsSelectorHook = {
  useContractorsSelector,
};

export default contractorsSelectorHook;
