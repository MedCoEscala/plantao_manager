import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import ColorField from '@/components/form/ColorField';

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

  const { showToast } = useToast();

  // Carregar dados se for edição
  useEffect(() => {
    if (locationId && !initialValues.name) {
      setIsLoading(true);
      // Simular carregamento de dados (substituir por API real)
      setTimeout(() => {
        // Dados simulados para edição
        setName('Hospital Central');
        setAddress('Av. Principal, 123');
        setPhone('(11) 5555-1234');
        setSelectedColor('#0077B6');
        setIsLoading(false);
      }, 1000);
    }
  }, [locationId, initialValues]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!selectedColor) {
      newErrors.color = 'Cor é obrigatória';
    }

    if (phone && !/^[()\d\s-]+$/.test(phone)) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  };

  // Salvar formulário
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Dados para enviar para API
      const formData = {
        id: locationId,
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        color: selectedColor,
      };

      console.log('Enviando dados:', formData);

      // Simular chamada de API (substituir por chamada real)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        locationId ? 'Local atualizado com sucesso!' : 'Local adicionado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      showToast('Erro ao salvar local', 'error');
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
        onChangeText={setName}
        placeholder="Nome do local"
        required
        error={errors.name}
        autoCapitalize="words"
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
      />

      <ColorField
        label="Cor"
        value={selectedColor}
        onValueChange={setSelectedColor}
        options={COLOR_PALETTE}
        required
        error={errors.color}
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
