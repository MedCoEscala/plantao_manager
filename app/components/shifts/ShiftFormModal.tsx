import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

import ShiftForm from './ShiftForm';
import KeyboardAwareFormModal from '../form/KeyboardAwareFormModal';

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
      const today = new Date();
      const isToday = initialDate.toDateString() === today.toDateString();

      if (isToday) {
        return 'Novo Plantão - Hoje';
      }

      return `Novo Plantão - ${format(initialDate, "dd 'de' MMMM", {
        locale: ptBR,
      })}`;
    }
    return 'Novo Plantão';
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <KeyboardAwareFormModal visible={visible} onClose={onClose} title={getModalTitle()}>
      <ShiftForm initialDate={initialDate} onSuccess={handleSuccess} onCancel={onClose} isModal />
    </KeyboardAwareFormModal>
  );
};

export default ShiftFormModal;
