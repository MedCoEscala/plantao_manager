import React from 'react';

import PaymentForm from './PaymentForm';
import KeyboardAwareFormModal from '../form/KeyboardAwareFormModal';

interface PaymentFormModalProps {
  visible: boolean;
  onClose: () => void;
  paymentId?: string;
  shiftId?: string;
  onSuccess?: () => void;
}

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  visible,
  onClose,
  paymentId,
  shiftId,
  onSuccess,
}) => {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <KeyboardAwareFormModal
      visible={visible}
      onClose={onClose}
      title={paymentId ? 'Editar Pagamento' : 'Novo Pagamento'}>
      <PaymentForm
        paymentId={paymentId}
        shiftId={shiftId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </KeyboardAwareFormModal>
  );
};

export default PaymentFormModal;
