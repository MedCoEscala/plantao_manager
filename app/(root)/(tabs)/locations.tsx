import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocations, Location } from '@app/hooks/useLocations';
import { useDialog } from '@app/contexts/DialogContext';

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { getLocations, deleteLocation, loading, error } = useLocations();
  const { showDialog } = useDialog();
  const router = useRouter();

  // Carregar locais ao montar o componente
  useEffect(() => {
    loadLocations();
  }, []);

  // Função para carregar ou atualizar os locais
  const loadLocations = async () => {
    setRefreshing(true);
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      showDialog({
        title: 'Erro',
        message: 'Não foi possível carregar os locais',
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Confirmar e excluir local
  const confirmDelete = (location: Location) => {
    showDialog({
      title: 'Confirmar exclusão',
      message: `Deseja realmente excluir o local "${location.name}"?`,
      type: 'confirm',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const success = await deleteLocation(location.id);
          if (success) {
            showDialog({
              title: 'Sucesso',
              message: 'Local excluído com sucesso',
              type: 'success',
            });
            // Recarregar lista
            loadLocations();
          } else {
            showDialog({
              title: 'Erro',
              message: error?.message || 'Não foi possível excluir o local',
              type: 'error',
            });
          }
        } catch (err) {
          showDialog({
            title: 'Erro',
            message: 'Ocorreu um erro ao excluir o local',
            type: 'error',
          });
        }
      },
    });
  };

  // Navegar para a tela de edição
  const navigateToEdit = (location: Location) => {
    router.push({
      pathname: '/locations/edit',
      params: { id: location.id },
    });
  };

  // Navegar para a tela de adição
  const navigateToAdd = () => {
    router.push('/locations/add');
  };

  // Renderizar item da lista
  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity
      className="mb-3 flex-row rounded-xl bg-white p-4 shadow-sm"
      onPress={() => navigateToEdit(item)}>
      <View
        className="mr-3 w-2 rounded-full"
        style={{ backgroundColor: item.color || '#0077B6' }}
      />
      <View className="flex-1">
        <Text className="mb-1 text-base font-bold text-gray-800">{item.name}</Text>
        <Text className="mb-1 text-sm text-gray-600">{item.address}</Text>
        {item.phone && <Text className="text-sm text-gray-600">{item.phone}</Text>}
      </View>
      <View className="justify-center">
        <TouchableOpacity className="p-2" onPress={() => confirmDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Text className="text-xl font-bold text-gray-800">Locais</Text>
        <TouchableOpacity className="p-2" onPress={loadLocations}>
          <Ionicons name="refresh-outline" size={24} color="#2B2D42" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      ) : locations.length > 0 ? (
        <View className="flex-1 px-4">
          <FlashList
            data={locations}
            renderItem={renderLocationItem}
            keyExtractor={(item: Location) => item.id}
            estimatedItemSize={80}
            refreshing={refreshing}
            onRefresh={loadLocations}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="location-outline" size={64} color="#8D99AE" />
          <Text className="mb-4 mt-4 text-center text-base text-gray-500">
            Nenhum local disponível
          </Text>
          <TouchableOpacity
            className="flex-row items-center rounded-md bg-blue-600 px-4 py-2"
            onPress={navigateToAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-white">Adicionar Local</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-md"
        onPress={navigateToAdd}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
