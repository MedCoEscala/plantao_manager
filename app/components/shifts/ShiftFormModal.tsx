import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ShiftForm from './ShiftForm';
import FormModal from '../form/FormModal';

interface ShiftFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onSuccess?: () => void;
}

const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  visible,
  onClose,
  initialDate,
  onSuccess,
}) => {
  const getModalTitle = () => {
    if (initialDate) {
      return `Novo Plantão: ${format(initialDate, "dd 'de' MMMM", { locale: ptBR })}`;
    }
    return 'Novo Plantão';
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title={getModalTitle()}>
      <ShiftForm
        initialDate={initialDate}
        onSuccess={handleSuccess}
        onCancel={onClose}
        isModal={true}
      />
    </FormModal>
  );
};

export default ShiftFormModal;
