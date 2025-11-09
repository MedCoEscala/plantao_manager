import { useState, useCallback, useEffect, useRef } from 'react';

import { useLocations } from '../contexts/LocationsContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLocationsApi } from '../services/locations-api';

const COLOR_PALETTE = [
  { color: '#0077B6', name: 'Azul' },
  { color: '#2A9D8F', name: 'Verde Água' },
  { color: '#E9C46A', name: 'Amarelo' },
  { color: '#E76F51', name: 'Coral' },
  { color: '#9381FF', name: 'Roxo' },
  { color: '#F72585', name: 'Rosa' },
  { color: '#3A0CA3', name: 'Azul Escuro' },
  { color: '#4CC9F0', name: 'Azul Claro' },
  { color: '#F7B801', name: 'Amarelo Ouro' },
  { color: '#7B2CBF', name: 'Roxo Escuro' },
  { color: '#55A630', name: 'Verde' },
  { color: '#FF477E', name: 'Rosa Claro' },
];

interface LocationFormData {
  name: string;
  address: string;
  phone: string;
  selectedColor: string;
}

interface LocationFormErrors {
  name?: string;
  address?: string;
  phone?: string;
  selectedColor?: string;
}

interface UseLocationFormProps {
  locationId?: string;
  initialValues?: {
    name?: string;
    address?: string;
    phone?: string;
    color?: string;
  };
  onSuccess?: () => void;
}

export function useLocationForm({ locationId, initialValues, onSuccess }: UseLocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>(() => ({
    name: initialValues?.name || '',
    address: initialValues?.address || '',
    phone: initialValues?.phone || '',
    selectedColor: initialValues?.color || COLOR_PALETTE[0].color,
  }));

  const [errors, setErrors] = useState<LocationFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!locationId);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { showError, showSuccess } = useNotification();
  const { refreshLocations } = useLocations();
  const locationsApi = useLocationsApi();

  // Usar ref para evitar loops infinitos
  const initialValuesRef = useRef(initialValues);
  const hasLoadedRef = useRef(false);

  // Carregar dados se for edição
  useEffect(() => {
    if (!locationId || hasLoadedRef.current) {
      setIsInitializing(false);
      return;
    }

    const loadLocationData = async () => {
      try {
        setIsInitializing(true);
        hasLoadedRef.current = true;

        const location = await locationsApi.getLocationById(locationId);

        setFormData({
          name: location.name || '',
          address: location.address || '',
          phone: location.phone ? String(location.phone) : '',
          selectedColor: location.color || COLOR_PALETTE[0].color,
        });
      } catch (error) {
        console.error('Erro ao carregar dados do local:', error);
        showError('Erro ao carregar dados do local');
      } finally {
        setIsInitializing(false);
      }
    };

    loadLocationData();
  }, [locationId]); // Apenas locationId como dependência

  // Atualizar dados quando initialValues mudar (apenas uma vez)
  useEffect(() => {
    if (!locationId && initialValuesRef.current !== initialValues && initialValues) {
      initialValuesRef.current = initialValues;
      setFormData({
        name: initialValues.name || '',
        address: initialValues.address || '',
        phone: initialValues.phone || '',
        selectedColor: initialValues.color || COLOR_PALETTE[0].color,
      });
    }
  }, [initialValues, locationId]);

  // Reset quando locationId mudar
  useEffect(() => {
    if (!locationId) {
      hasLoadedRef.current = false;
      setIsInitializing(false);
    }
  }, [locationId]);

  const updateField = useCallback(
    <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Limpar erro do campo se existir
      setErrors((prev) => {
        if (prev[field]) {
          return { ...prev, [field]: undefined };
        }
        return prev;
      });
    },
    [] // Removendo a dependência 'errors' para evitar loop infinito
  );

  const validateField = useCallback(
    (field: keyof LocationFormData, value: string): string | undefined => {
      switch (field) {
        case 'name':
          if (!value.trim()) {
            return 'Nome é obrigatório';
          }
          if (value.trim().length < 2) {
            return 'Nome deve ter pelo menos 2 caracteres';
          }
          if (value.trim().length > 100) {
            return 'Nome deve ter no máximo 100 caracteres';
          }
          break;

        case 'phone':
          if (value && value.trim()) {
            if (!/^[()\d\s-]+$/.test(value)) {
              return 'Formato de telefone inválido';
            }
            const phoneDigits = value.replace(/\D/g, '');
            if (phoneDigits.length < 8 || phoneDigits.length > 11) {
              return 'Telefone deve ter entre 8 e 11 dígitos';
            }
          }
          break;

        case 'address':
          if (value && value.trim() && value.trim().length > 500) {
            return 'Endereço deve ter no máximo 500 caracteres';
          }
          break;

        case 'selectedColor':
          if (!value) {
            return 'Cor é obrigatória';
          }
          break;
      }
      return undefined;
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: LocationFormErrors = {};

    Object.keys(formData).forEach((key) => {
      const field = key as keyof LocationFormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handlePhoneChange = useCallback(
    (text: string) => {
      // Remove tudo exceto dígitos
      const cleaned = text.replace(/\D/g, '');

      let formatted = '';
      if (cleaned.length <= 2) {
        formatted = cleaned;
      } else if (cleaned.length <= 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      } else {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
      }

      updateField('phone', formatted);

      if (hasSubmitted) {
        const error = validateField('phone', formatted);
        setErrors((prev) => ({ ...prev, phone: error }));
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  const handleNameChange = useCallback(
    (text: string) => {
      updateField('name', text);

      if (hasSubmitted) {
        const error = validateField('name', text);
        setErrors((prev) => ({ ...prev, name: error }));
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  const handleAddressChange = useCallback(
    (text: string) => {
      updateField('address', text);

      if (hasSubmitted) {
        const error = validateField('address', text);
        setErrors((prev) => ({ ...prev, address: error }));
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true);

    if (!validateForm()) {
      showError('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados base obrigatórios
      const locationData: any = {
        name: formData.name.trim(),
        color: formData.selectedColor,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.address && formData.address.trim()) {
        locationData.address = formData.address.trim();
      }

      if (formData.phone && formData.phone.trim()) {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits && phoneDigits.length >= 8) {
          locationData.phone = Number(phoneDigits);
        }
      }

      if (locationId) {
        await locationsApi.updateLocation(locationId, locationData);
        showSuccess('Local atualizado com sucesso!');
      } else {
        await locationsApi.createLocation(locationData);
        showSuccess('Local criado com sucesso!');
      }

      // Atualizar lista de locais
      await refreshLocations();

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar local:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      showError(`Erro ao salvar local: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    formData,
    validateForm,
    locationId,
    locationsApi,
    showSuccess,
    showError,
    refreshLocations,
    onSuccess,
  ]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      selectedColor: COLOR_PALETTE[0].color,
    });
    setErrors({});
    setHasSubmitted(false);
  }, []);

  return {
    // Estado
    formData,
    errors,
    isLoading,
    isInitializing,
    hasSubmitted,

    // Constantes
    COLOR_PALETTE,

    // Handlers
    updateField,
    handlePhoneChange,
    handleNameChange,
    handleAddressChange,
    handleSubmit,
    resetForm,

    // Validação
    validateField,
    validateForm,
  };
}
