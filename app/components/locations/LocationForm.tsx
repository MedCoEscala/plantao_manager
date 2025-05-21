import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
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

export default function LocationForm({
  locationId,
  initialValues = {},
  onSuccess,
  onCancel,
}: LocationFormProps) {
  // Estados do formulário
  const [name, setName] = useState(initialValues.name || '');
  const [address, setAddress] = useState(initialValues.address || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [selectedColor, setSelectedColor] = useState(initialValues.color || COLOR_PALETTE[0].color);

  // Estados de validação e UI
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { showToast } = useToast();
  const locationsApi = useLocationsApi();

  // Atualizar valores se as props mudarem
  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setAddress(initialValues.address || '');
      setPhone(initialValues.phone || '');
      setSelectedColor(initialValues.color || COLOR_PALETTE[0].color);
    }
  }, [initialValues]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!selectedColor) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (phone && phone.trim()) {
      // Verifica se tem formato válido (apenas parênteses, dígitos, espaços e hífens)
      if (!/^[()\d\s-]+$/.test(phone)) {
        newErrors.phone = 'Formato de telefone inválido';
      }

      // Verifica se tem dígitos suficientes
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 8 || phoneDigits.length > 11) {
        newErrors.phone = 'Telefone deve ter entre 8 e 11 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar quando sair do campo
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    if (field === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Nome é obrigatório';
      } else if (value.trim().length < 3) {
        newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'phone') {
      if (value && value.trim()) {
        // Verifica se tem formato válido (apenas parênteses, dígitos, espaços e hífens)
        if (!/^[()\d\s-]+$/.test(value)) {
          newErrors.phone = 'Formato de telefone inválido';
        } else {
          // Verifica se tem dígitos suficientes
          const phoneDigits = value.replace(/\D/g, '');
          if (phoneDigits.length < 8 || phoneDigits.length > 11) {
            newErrors.phone = 'Telefone deve ter entre 8 e 11 dígitos';
          } else {
            delete newErrors.phone;
          }
        }
      } else {
        delete newErrors.phone;
      }
    }

    setErrors(newErrors);
  };

  // Formatar telefone
  const handlePhoneChange = (text: string) => {
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

    setPhone(formatted);

    if (hasSubmitted) {
      validateField('phone', formatted);
    }
  };

  // Atualizar nome com validação
  const handleNameChange = (text: string) => {
    setName(text);

    if (hasSubmitted) {
      validateField('name', text);
    }
  };

  // Salvar formulário
  const handleSubmit = async () => {
    setHasSubmitted(true);

    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Converter telefone para número removendo todos os caracteres não numéricos
      let phoneValue = undefined;
      if (phone && phone.trim()) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits) {
          phoneValue = Number(phoneDigits);
        }
      }

      // Dados para enviar para API
      const formData = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phoneValue,
        color: selectedColor,
      };

      console.log(`[LocationForm] ${locationId ? 'Atualizando' : 'Criando'} local:`, formData);

      if (locationId) {
        // Atualizar local existente
        await locationsApi.updateLocation(locationId, formData);
        showToast('Local atualizado com sucesso!', 'success');
      } else {
        // Criar novo local
        await locationsApi.createLocation(formData);
        showToast('Local adicionado com sucesso!', 'success');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao salvar local:', error);
      showToast(`Erro ao salvar local: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Componente de visualização do local (preview)
  const LocationPreview = () => (
    <View
      className="mb-6 w-full items-center justify-center rounded-xl p-6"
      style={{ backgroundColor: selectedColor }}>
      <Text className="mb-1 text-lg font-bold text-white">{name || 'Nome do Local'}</Text>
      <Text className="text-center text-white opacity-90">
        {address || 'Endereço do local (opcional)'}
      </Text>
    </View>
  );

  return (
    <View className="space-y-4">
      <LocationPreview />

      <Input
        label="Nome"
        value={name}
        onChangeText={handleNameChange}
        placeholder="Nome do local"
        required
        error={errors.name}
        autoCapitalize="words"
        disabled={isLoading}
        onBlur={() => validateField('name', name)}
      />

      <Input
        label="Endereço"
        value={address}
        onChangeText={setAddress}
        placeholder="Endereço completo"
        helperText="Opcional"
        multiline
        numberOfLines={2}
        autoCapitalize="sentences"
        disabled={isLoading}
      />

      <Input
        label="Telefone"
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder="(00) 00000-0000"
        keyboardType="phone-pad"
        helperText="Opcional"
        error={errors.phone}
        leftIcon="call-outline"
        disabled={isLoading}
        onBlur={() => validateField('phone', phone)}
      />

      <ColorField
        label="Cor"
        value={selectedColor}
        onValueChange={setSelectedColor}
        options={COLOR_PALETTE}
        required
        error={errors.color}
        disabled={isLoading}
      />

      <View className="mt-4 flex-row space-x-3">
        {onCancel && (
          <Button variant="outline" onPress={onCancel} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button variant="primary" onPress={handleSubmit} loading={isLoading} className="flex-1">
          {locationId ? 'Atualizar' : 'Salvar'}
        </Button>
      </View>
    </View>
  );
}
