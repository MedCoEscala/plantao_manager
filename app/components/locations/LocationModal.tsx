import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LocationForm from './LocationForm';
import FormModal from '../form/FormModal';

import { useLocationsApi } from '@/services/locations-api';

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
  const [isLoading, setIsLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<any>({});
  const locationsApi = useLocationsApi();

  // Buscar dados do local se for edição
  const fetchLocationData = useCallback(async () => {
    if (!locationId || !visible) return;

    try {
      setIsLoading(true);
      const location = await locationsApi.getLocationById(locationId);

      setInitialValues({
        name: location.name,
        address: location.address,
        phone: location.phone,
        color: location.color,
      });
    } catch (error) {
      console.error('Erro ao carregar local para edição:', error);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, visible, locationsApi]);

  useEffect(() => {
    fetchLocationData();
  }, [fetchLocationData]);

  const handleSuccess = useCallback(() => {
    // Limpar valores iniciais quando fechar
    setInitialValues({});

    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess]);

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={locationId ? 'Editar Local' : 'Novo Local'}>
      {isLoading ? (
        <View className="items-center justify-center py-10">
          <ActivityIndicator size="large" color="#18cb96" />
        </View>
      ) : (
        <LocationForm
          locationId={locationId}
          initialValues={initialValues}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      )}
    </FormModal>
  );
};

export default LocationFormModal;
