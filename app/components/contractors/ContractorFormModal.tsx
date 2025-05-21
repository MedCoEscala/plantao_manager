import React from 'react';
import ContractorForm from './ContractorForm';
import FormModal from '../form/FormModal';

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
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={contractorId ? 'Editar Contratante' : 'Novo Contratante'}>
      <ContractorForm contractorId={contractorId} onSuccess={handleSuccess} onCancel={onClose} />
    </FormModal>
  );
};

export default ContractorFormModal;
