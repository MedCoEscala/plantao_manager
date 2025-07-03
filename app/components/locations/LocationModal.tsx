import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LocationForm from './LocationForm';
import FormModal from '../form/FormModal';

import { useLocationsApi } from '../../services/locations-api';

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
  const isLoadingRef = useRef(false);

  // Buscar dados do local se for edição
  useEffect(() => {
    const fetchLocationData = async () => {
      if (!locationId || !visible) {
        console.log(
          '🔄 LocationModal: Não carregando dados - locationId:',
          locationId,
          'visible:',
          visible
        );
        return;
      }

      // Evitar carregamentos duplicados
      if (isLoadingRef.current) {
        console.log('🔄 LocationModal: Já está carregando, ignorando...');
        return;
      }

      console.log('🔄 LocationModal: Iniciando carregamento do local:', locationId);
      try {
        isLoadingRef.current = true;
        setIsLoading(true);
        const location = await locationsApi.getLocationById(locationId);

        console.log('✅ LocationModal: Local carregado com sucesso:', location);
        setInitialValues({
          name: location.name,
          address: location.address,
          phone: location.phone,
          color: location.color,
        });
      } catch (error) {
        console.error('❌ LocationModal: Erro ao carregar local para edição:', error);
        // Se houver erro, fechar o modal
        onClose();
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    fetchLocationData();
  }, [locationId, visible]); // Removido locationsApi e onClose das dependências

  const handleSuccess = useCallback(() => {
    // Limpar valores iniciais quando fechar
    setInitialValues({});
    isLoadingRef.current = false;

    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess]);

  // Reset loading ref quando modal fechar
  useEffect(() => {
    if (!visible) {
      isLoadingRef.current = false;
      setInitialValues({});
    }
  }, [visible]);

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
