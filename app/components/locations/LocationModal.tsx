import React from 'react';
import LocationForm from './LocationForm';
import FormModal from '../form/FormModal';

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
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={locationId ? 'Editar Local' : 'Novo Local'}>
      <LocationForm locationId={locationId} onSuccess={handleSuccess} onCancel={onClose} />
    </FormModal>
  );
};

export default LocationFormModal;
