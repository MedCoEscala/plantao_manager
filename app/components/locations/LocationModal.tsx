import React, { useCallback } from 'react';

import LocationForm from './LocationForm';
import KeyboardAwareFormModal from '../form/KeyboardAwareFormModal';

interface LocationFormModalProps {
  visible: boolean;
  onClose: () => void;
  locationId?: string;
  onSuccess?: () => void;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  visible,
  onClose,
  locationId,
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
      title={locationId ? 'Editar Local' : 'Novo Local'}>
      <LocationForm locationId={locationId} onSuccess={handleSuccess} onCancel={onClose} />
    </KeyboardAwareFormModal>
  );
};

export default LocationFormModal;
