import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDialog } from '@app/contexts/DialogContext';

const COLORS = [
  '#0077B6', // Azul
  '#EF476F', // Rosa
  '#06D6A0', // Verde-água
  '#FFD166', // Amarelo
  '#073B4C', // Azul escuro
  '#118AB2', // Azul claro
  '#9381FF', // Roxo
  '#FF6B35', // Laranja
];

export default function EditLocationScreen() {
  const [location, setLocation] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { getLocationById, updateLocation } = useLocations();
  const { showDialog } = useDialog();
  const router = useRouter();
  const params = useLocalSearchParams();
  const locationId = params.id as string;

  // Carregar os dados do local
  useEffect(() => {
    const loadLocation = async () => {
      if (!locationId) {
        showDialog({
          title: 'Erro',
          message: 'ID do local não fornecido',
          type: 'error',
          onConfirm: () => router.back(),
        });
        return;
      }

      try {
        const locationData = await getLocationById(locationId);
        if (locationData) {
          setLocation(locationData);
          setName(locationData.name);
          setAddress(locationData.address);
          setPhone(locationData.phone || '');
          setSelectedColor(locationData.color || COLORS[0]);
        } else {
          showDialog({
            title: 'Erro',
            message: 'Local não encontrado',
            type: 'error',
            onConfirm: () => router.back(),
          });
        }
      } catch (error) {
        showDialog({
          title: 'Erro',
          message: error instanceof Error ? error.message : 'Erro ao carregar local',
          type: 'error',
          onConfirm: () => router.back(),
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadLocation();
  }, [locationId]);

  const handleUpdateLocation = async () => {
    // Validação básica
    if (!name.trim()) {
      showDialog({
        title: 'Atenção',
        message: 'O nome do local é obrigatório',
        type: 'warning',
      });
      return;
    }

    if (!address.trim()) {
      showDialog({
        title: 'Atenção',
        message: 'O endereço do local é obrigatório',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const success = await updateLocation({
        id: locationId,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        color: selectedColor,
      });

      if (success) {
        showDialog({
          title: 'Sucesso',
          message: 'Local atualizado com sucesso!',
          type: 'success',
          onConfirm: () => router.back(),
        });
      } else {
        showDialog({
          title: 'Erro',
          message: 'Não foi possível atualizar o local',
          type: 'error',
        });
      }
    } catch (error) {
      showDialog({
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0077B6" />
        <Text className="mt-4 text-gray-600">Carregando local...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row items-center border-b border-gray-200 px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Ionicons name="arrow-back" size={24} color="#2B2D42" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Editar Local</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="mb-1 text-sm font-medium text-gray-700">Nome</Text>
          <TextInput
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-800"
            placeholder="Nome do local"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-6">
          <Text className="mb-1 text-sm font-medium text-gray-700">Endereço</Text>
          <TextInput
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-800"
            placeholder="Endereço completo"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View className="mb-6">
          <Text className="mb-1 text-sm font-medium text-gray-700">Telefone (opcional)</Text>
          <TextInput
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-800"
            placeholder="(00) 00000-0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View className="mb-8">
          <Text className="mb-3 text-sm font-medium text-gray-700">Cor</Text>
          <View className="flex-row flex-wrap">
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                className={`mb-4 mr-4 h-10 w-10 items-center justify-center rounded-full ${
                  selectedColor === color ? 'border-2 border-gray-800' : ''
                }`}
                style={{ backgroundColor: color }}
                onPress={() => setSelectedColor(color)}>
                {selectedColor === color && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className={`w-full items-center rounded-md py-3 ${
            loading ? 'bg-blue-300' : 'bg-blue-600'
          }`}
          onPress={handleUpdateLocation}
          disabled={loading}>
          <Text className="font-medium text-white">
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
