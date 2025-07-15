import React, { useCallback } from 'react';

import ContractorForm from './ContractorForm';
import KeyboardAwareFormModal from '../form/KeyboardAwareFormModal';

interface ContractorFormModalProps {
  visible: boolean;
  onClose: () => void;
  contractorId?: string;
  onSuccess?: () => void;
}

export const ContractorFormModal: React.FC<ContractorFormModalProps> = ({
  visible,
  onClose,
  contractorId,
  onSuccess,
}) => {
  const handleSuccess = useCallback(() => {
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);

  return (
    <KeyboardAwareFormModal
      visible={visible}
      onClose={onClose}
      title={contractorId ? 'Editar Contratante' : 'Novo Contratante'}>
      <ContractorForm contractorId={contractorId} onSuccess={handleSuccess} onCancel={onClose} />
    </KeyboardAwareFormModal>
  );
};

export default ContractorFormModal;
