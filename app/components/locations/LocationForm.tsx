import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INPUT_WIDTH = SCREEN_WIDTH - 48;

export default function LocationForm({
  locationId,
  initialValues = {},
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const [name, setName] = useState(initialValues.name || '');
  const [address, setAddress] = useState(initialValues.address || '');
  const [phone, setPhone] = useState(initialValues.phone || '');
  const [selectedColor, setSelectedColor] = useState(initialValues.color || COLOR_PALETTE[0].color);

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!locationId);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const colorPickerHeight = useState(new Animated.Value(0))[0];
  const formOpacity = useState(new Animated.Value(0))[0];

  const router = useRouter();
  const { showDialog } = useDialog();
  const { showToast } = useToast();

  useEffect(() => {
    if (locationId) {
      loadLocationData();
    } else {
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [locationId]);

  useEffect(() => {
    Animated.timing(colorPickerHeight, {
      toValue: colorPickerOpen ? 140 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [colorPickerOpen]);

  const loadLocationData = async () => {
    setInitialLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const locationData = {
        id: locationId,
        name: initialValues.name || 'Hospital Central',
        address: initialValues.address || 'Av. Principal, 123',
        phone: initialValues.phone || '(51) 9999-1111',
        color: initialValues.color || '#0077B6',
      };

      setName(locationData.name);
      setAddress(locationData.address);
      setPhone(locationData.phone);
      setSelectedColor(locationData.color);

      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Erro ao carregar dados do local:', error);
      showToast('Erro ao carregar dados do local', 'error');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handlePhoneChange = (text: string) => {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const locationData = {
        id: locationId,
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        color: selectedColor,
      };

      console.log('Salvando local:', locationData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(
        locationId ? 'Local atualizado com sucesso!' : 'Local adicionado com sucesso!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      showToast('Erro ao salvar local', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (name.trim() || address.trim() || phone.trim() || selectedColor !== COLOR_PALETTE[0].color) {
      showDialog({
        title: 'Cancelar',
        message: 'Deseja realmente cancelar? Todas as alterações serão perdidas.',
        type: 'confirm',
        onConfirm: () => {
          if (onCancel) {
            onCancel();
          } else {
            router.back();
          }
        },
      });
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.back();
      }
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#18cb96" />
        <Text className="mt-4 text-text-light">Carregando dados do local...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: formOpacity }}>
          <View className="mb-6">
            <Text className="mb-2 text-2xl font-bold text-text-dark">
              {locationId ? 'Editar Local' : 'Novo Local'}
            </Text>
            <Text className="text-text-light">
              {locationId
                ? 'Atualize as informações do local de plantão'
                : 'Preencha os dados para adicionar um novo local de plantão'}
            </Text>
          </View>

          <View
            className="mb-8 w-full items-center justify-center rounded-xl p-6"
            style={{ backgroundColor: selectedColor }}>
            <Text className="mb-1 text-lg font-bold text-white">{name || 'Nome do Local'}</Text>
            <Text className="text-center text-white opacity-90">
              {address || 'Endereço do local (opcional)'}
            </Text>
          </View>

          <View className="mb-4">
            <View className="mb-1 flex-row items-center">
              <Text className="text-sm font-medium text-text-dark">Nome</Text>
              <Text className="ml-1 text-error">*</Text>
            </View>
            <TextInput
              className={`rounded-lg border bg-white p-3 text-text-dark ${
                errors.name ? 'border-error' : 'border-background-300'
              }`}
              placeholder="Nome do local"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              returnKeyType="next"
            />
            {errors.name && <Text className="mt-1 text-xs text-error">{errors.name}</Text>}
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-text-dark">
              Endereço <Text className="text-xs text-text-light">(opcional)</Text>
            </Text>
            <TextInput
              className="rounded-lg border border-background-300 bg-white p-3 text-text-dark"
              placeholder="Endereço completo"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              returnKeyType="next"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-text-dark">
              Telefone <Text className="text-xs text-text-light">(opcional)</Text>
            </Text>
            <TextInput
              className={`rounded-lg border bg-white p-3 text-text-dark ${
                errors.phone ? 'border-error' : 'border-background-300'
              }`}
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
            {errors.phone && <Text className="mt-1 text-xs text-error">{errors.phone}</Text>}
          </View>

          <View className="mb-4">
            <View className="mb-1 flex-row items-center">
              <Text className="text-sm font-medium text-text-dark">Cor</Text>
              <Text className="ml-1 text-error">*</Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-between rounded-lg border border-background-300 bg-white p-3"
              onPress={() => setColorPickerOpen(!colorPickerOpen)}>
              <View className="flex-row items-center">
                <View
                  className="mr-3 h-6 w-6 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <Text className="text-text-dark">
                  {COLOR_PALETTE.find((c) => c.color === selectedColor)?.name ||
                    'Cor personalizada'}
                </Text>
              </View>
              <Ionicons
                name={colorPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
            {errors.color && <Text className="mt-1 text-xs text-error">{errors.color}</Text>}

            <Animated.View
              style={{
                height: colorPickerHeight,
                overflow: 'hidden',
              }}>
              <View className="mt-3 flex-row flex-wrap rounded-lg border border-background-200 bg-background-50 p-3">
                {COLOR_PALETTE.map((item) => (
                  <TouchableOpacity
                    key={item.color}
                    className="m-1 items-center justify-center rounded-full border-2"
                    style={{
                      backgroundColor: item.color,
                      width: 36,
                      height: 36,
                      borderColor: selectedColor === item.color ? '#1e293b' : 'transparent',
                    }}
                    onPress={() => {
                      setSelectedColor(item.color);
                      if (errors.color) {
                        setErrors((prev) => ({ ...prev, color: '' }));
                      }
                    }}>
                    {selectedColor === item.color && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </View>

          <View className="mt-8 flex-row">
            <Button
              variant="outline"
              className="mr-2 flex-1"
              onPress={handleCancel}
              disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="ml-2 flex-1"
              onPress={handleSubmit}
              loading={isLoading}>
              {locationId ? 'Atualizar' : 'Salvar'}
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
