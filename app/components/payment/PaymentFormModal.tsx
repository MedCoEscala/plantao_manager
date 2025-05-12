import React from 'react';
import PaymentForm from './PaymentForm';
import FormModal from '../form/FormModal';

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
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={paymentId ? 'Editar Pagamento' : 'Novo Pagamento'}>
      <PaymentForm
        paymentId={paymentId}
        shiftId={shiftId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </FormModal>
  );
};

export default PaymentFormModal;
