import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { useNotification } from '@/components';
import ColorField from '@/components/form/ColorField';
import { useLocationsApi } from '@/services/locations-api';

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

interface LocationFormProps {
  locationId?: string;
  initialValues?: {
    name?: string;
    address?: string;
    phone?: string;
    color?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  selectedColor: string;
}

export default function LocationForm({
  locationId,
  initialValues = {},
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const [formData, setFormData] = useState<FormData>(() => ({
    name: initialValues.name || '',
    address: initialValues.address || '',
    phone: initialValues.phone || '',
    selectedColor: initialValues.color || COLOR_PALETTE[0].color,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { showError, showSuccess } = useNotification();
  const locationsApi = useLocationsApi();

  // Atualizar dados do formulário
  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Limpar erro do campo se existir
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  // Atualizar valores se as props mudarem
  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name || '',
        address: initialValues.address || '',
        phone: initialValues.phone || '',
        selectedColor: initialValues.color || COLOR_PALETTE[0].color,
      });
    }
  }, [initialValues]);

  // Validação do formulário
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome (OBRIGATÓRIO)
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    // Validar cor (OBRIGATÓRIO)
    if (!formData.selectedColor) {
      newErrors.selectedColor = 'Cor é obrigatória';
    }

    // Validar telefone (OPCIONAL - apenas se preenchido)
    if (formData.phone && formData.phone.trim()) {
      if (!/^[()\d\s-]+$/.test(formData.phone)) {
        newErrors.phone = 'Formato de telefone inválido';
      } else {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 8 || phoneDigits.length > 11) {
          newErrors.phone = 'Telefone deve ter entre 8 e 11 dígitos';
        }
      }
    }

    // Validar endereço (OPCIONAL - apenas se preenchido)
    if (formData.address && formData.address.trim() && formData.address.trim().length > 500) {
      newErrors.address = 'Endereço deve ter no máximo 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Validar campo específico
  const validateField = useCallback(
    (field: keyof FormData, value: string) => {
      const newErrors = { ...errors };

      switch (field) {
        case 'name':
          if (!value.trim()) {
            newErrors.name = 'Nome é obrigatório';
          } else if (value.trim().length < 2) {
            newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
          } else if (value.trim().length > 100) {
            newErrors.name = 'Nome deve ter no máximo 100 caracteres';
          } else {
            delete newErrors.name;
          }
          break;

        case 'phone':
          // Apenas validar se algo foi digitado
          if (value && value.trim()) {
            if (!/^[()\d\s-]+$/.test(value)) {
              newErrors.phone = 'Formato de telefone inválido';
            } else {
              const phoneDigits = value.replace(/\D/g, '');
              if (phoneDigits.length < 8 || phoneDigits.length > 11) {
                newErrors.phone = 'Telefone deve ter entre 8 e 11 dígitos';
              } else {
                delete newErrors.phone;
              }
            }
          } else {
            // Campo vazio é válido (opcional)
            delete newErrors.phone;
          }
          break;

        case 'address':
          // Apenas validar se algo foi digitado
          if (value && value.trim()) {
            if (value.trim().length > 500) {
              newErrors.address = 'Endereço deve ter no máximo 500 caracteres';
            } else {
              delete newErrors.address;
            }
          } else {
            // Campo vazio é válido (opcional)
            delete newErrors.address;
          }
          break;
      }

      setErrors(newErrors);
    },
    [errors]
  );

  // Formatar telefone
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
        validateField('phone', formatted);
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  // Manipular mudança de nome
  const handleNameChange = useCallback(
    (text: string) => {
      updateField('name', text);

      if (hasSubmitted) {
        validateField('name', text);
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  // Manipular mudança de endereço
  const handleAddressChange = useCallback(
    (text: string) => {
      updateField('address', text);

      if (hasSubmitted) {
        validateField('address', text);
      }
    },
    [updateField, hasSubmitted, validateField]
  );

  // Salvar formulário
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

      console.log(`[LocationForm] ${locationId ? 'Atualizando' : 'Criando'} local:`, locationData);

      if (locationId) {
        await locationsApi.updateLocation(locationId, locationData);
        showSuccess('Local atualizado com sucesso!');
      } else {
        await locationsApi.createLocation(locationData);
        showSuccess('Local criado com sucesso!');
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar local:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      showError(`Erro ao salvar local: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, locationId, locationsApi, showSuccess, showError, onSuccess]);

  // Componente de pré-visualização
  const LocationPreview = useCallback(
    () => (
      <View
        className="w-full items-center justify-center rounded-2xl p-8 shadow-sm"
        style={{ backgroundColor: formData.selectedColor }}>
        <View className="items-center">
          <Text className="text-center text-xl font-bold text-white">
            {formData.name.trim() || 'Nome do Local'}
          </Text>
          {formData.address.trim() && (
            <Text className="mt-2 text-center text-sm leading-5 text-white/90">
              {formData.address.trim()}
            </Text>
          )}
          {formData.phone.trim() && (
            <Text className="mt-1 text-center text-xs text-white/80">📞 {formData.phone}</Text>
          )}
        </View>
      </View>
    ),
    [formData]
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled">
      {/* Seção: Pré-visualização */}
      <Card className="mx-6 mb-6 mt-6">
        <SectionHeader
          title="Pré-visualização"
          subtitle="Veja como o local aparecerá nos plantões"
          icon="eye-outline"
        />
        <View className="mt-4">
          <LocationPreview />
        </View>
      </Card>

      {/* Seção: Informações Básicas */}
      <Card className="mx-6 mb-6">
        <SectionHeader
          title="Informações do Local"
          subtitle="Dados principais para identificação"
          icon="location-outline"
        />

        <View className="mt-6 space-y-6">
          <Input
            label="Nome do Local"
            value={formData.name}
            onChangeText={handleNameChange}
            placeholder="Ex: Hospital São José, Clínica ABC..."
            required
            error={errors.name}
            autoCapitalize="words"
            disabled={isLoading}
            onBlur={() => validateField('name', formData.name)}
            maxLength={100}
            leftIcon="business-outline"
          />

          <Input
            label="Endereço (opcional)"
            value={formData.address}
            onChangeText={handleAddressChange}
            placeholder="Rua, número, bairro, cidade..."
            helperText="Endereço completo do local"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            disabled={isLoading}
            onBlur={() => validateField('address', formData.address)}
            maxLength={500}
            leftIcon="location-outline"
            error={errors.address}
          />

          <Input
            label="Telefone (opcional)"
            value={formData.phone}
            onChangeText={handlePhoneChange}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            helperText="Número para contato do local"
            error={errors.phone}
            leftIcon="call-outline"
            disabled={isLoading}
            onBlur={() => validateField('phone', formData.phone)}
          />
        </View>
      </Card>

      {/* Seção: Personalização */}
      <Card className="mx-6 mb-6">
        <SectionHeader
          title="Personalização"
          subtitle="Escolha uma cor para identificar este local"
          icon="color-palette-outline"
        />

        <View className="mt-6">
          <ColorField
            label="Cor de Identificação"
            value={formData.selectedColor}
            onValueChange={(color) => updateField('selectedColor', color)}
            options={COLOR_PALETTE}
            required
            error={errors.selectedColor}
            disabled={isLoading}
          />
        </View>
      </Card>

      {/* Botões de Ação */}
      <View className="mx-6 mb-6 mt-8">
        <View className="flex-row gap-4">
          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isLoading}
              className="h-14 flex-1 rounded-2xl border-2">
              <Text
                className={`text-base font-semibold ${
                  isLoading ? 'text-gray-400' : 'text-text-dark'
                }`}>
                Cancelar
              </Text>
            </Button>
          )}

          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            className={`${onCancel ? 'flex-1' : 'w-full'} h-14 rounded-2xl shadow-lg`}>
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" className="mr-3" />
                <Text className="text-base font-semibold text-white">Salvando...</Text>
              </View>
            ) : (
              <Text className="text-base font-semibold text-white">
                {locationId ? 'Atualizar Local' : 'Criar Local'}
              </Text>
            )}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
