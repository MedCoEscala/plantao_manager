import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocationFormModal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../contexts/DialogContext';
import { useLocationsApi, Location, LocationsFilters } from '../../services/locations-api';

const LocationsScreen = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();
  const locationsApi = useLocationsApi();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  const loadLocations = useCallback(
    async (forceLoad = false) => {
      if (!forceLoad && !isFirstLoad && (refreshing || isLoading)) return;

      setRefreshing(true);
      setIsLoading(true);

      try {
        const filters: LocationsFilters = {};
        if (searchQuery.trim()) {
          filters.searchTerm = searchQuery.trim();
        }

        console.log('[LocationsScreen] Carregando locais...');
        const data = await locationsApi.getLocations(filters);
        console.log(`[LocationsScreen] ${data.length} locais carregados`);

        setLocations(data);
        setFilteredLocations(data);

        if (refreshing && !isFirstLoad) {
          showToast('Locais atualizados com sucesso', 'success');
        }

        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      } catch (error: any) {
        console.error('Erro ao carregar locais:', error);
        showToast(`Erro ao carregar locais: ${error.message || 'Erro desconhecido'}`, 'error');

        // Parar o loop infinito em caso de erro
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      } finally {
        setRefreshing(false);
        setIsLoading(false);
      }
    },
    [searchQuery, refreshing, isLoading, isFirstLoad, locationsApi, showToast]
  );

  // Carregamento inicial apenas uma vez - usando ref para evitar loop
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadLocations(true);
    }
  }, []); // Sem dependências para evitar loop

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredLocations(locations);
      } else {
        const filtered = locations.filter(
          (location) =>
            location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            location.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            false
        );
        setFilteredLocations(filtered);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, locations]);

  const confirmDelete = useCallback(
    (location: Location) => {
      showDialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o local "${location.name}"?`,
        type: 'confirm',
        confirmText: 'Excluir',
        onConfirm: async () => {
          try {
            await locationsApi.deleteLocation(location.id);
            setLocations((prev) => prev.filter((loc) => loc.id !== location.id));
            setFilteredLocations((prev) => prev.filter((loc) => loc.id !== location.id));
            showToast('Local excluído com sucesso', 'success');
          } catch (error: any) {
            console.error('Erro ao excluir local:', error);
            showToast(`Erro ao excluir local: ${error.message || 'Erro desconhecido'}`, 'error');
          }
        },
      });
    },
    [showDialog, showToast, locationsApi]
  );

  const handleEditLocation = useCallback((location: Location) => {
    setSelectedLocation(location);
    setIsAddModalVisible(true);
  }, []);

  const handleAddLocation = useCallback(() => {
    setSelectedLocation(null);
    setIsAddModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsAddModalVisible(false);
    setSelectedLocation(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setIsAddModalVisible(false);
    setSelectedLocation(null);
    // Recarregar apenas quando necessário - usando função direta
    setTimeout(() => {
      setRefreshing(true);
      setIsLoading(true);
      const filters: LocationsFilters = {};
      if (searchQuery.trim()) {
        filters.searchTerm = searchQuery.trim();
      }
      locationsApi
        .getLocations(filters)
        .then((data) => {
          setLocations(data);
          setFilteredLocations(data);
          console.log(`[LocationsScreen] ${data.length} locais recarregados após modal`);
        })
        .catch((error) => {
          console.error('Erro ao recarregar locais após modal:', error);
          showToast(`Erro ao recarregar locais: ${error.message || 'Erro desconhecido'}`, 'error');
        })
        .finally(() => {
          setRefreshing(false);
          setIsLoading(false);
        });
    }, 100);
  }, [searchQuery, locationsApi, showToast]);

  const toggleSearch = useCallback(() => {
    if (showSearch && searchQuery) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  }, [showSearch, searchQuery]);

  const renderLocationItem = useCallback(
    ({ item, index }: { item: Location; index: number }) => {
      const translateY = new Animated.Value(50);
      const opacity = new Animated.Value(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();

      return (
        <Animated.View
          style={{
            transform: [{ translateY }],
            opacity,
          }}>
          <TouchableOpacity
            className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm"
            style={{
              borderLeftWidth: 6,
              borderLeftColor: item.color || '#0077B6',
            }}
            activeOpacity={0.7}
            onPress={() => handleEditLocation(item)}>
            <View className="flex-row">
              <View className="flex-1 p-4">
                <View className="mb-1 flex-row items-center">
                  <Text className="text-lg font-bold text-text-dark">{item.name}</Text>
                </View>

                {item.address && (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text
                      className="ml-1 text-sm text-text-light"
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {item.address}
                    </Text>
                  </View>
                )}

                {item.phone && (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="call-outline" size={14} color="#64748b" />
                    <Text className="ml-1 text-sm text-text-light">{item.phone}</Text>
                  </View>
                )}
              </View>

              <View className="justify-center pr-4">
                <TouchableOpacity
                  className="h-8 w-8 items-center justify-center rounded-full bg-background-100"
                  onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [confirmDelete, handleEditLocation]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="z-10 border-b border-background-300 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-text-dark">Meus Locais</Text>

          <View className="flex-row">
            <TouchableOpacity
              className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={toggleSearch}>
              <Ionicons
                name={showSearch ? 'close-outline' : 'search-outline'}
                size={20}
                color="#1e293b"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full bg-background-100"
              onPress={() => {
                if (!refreshing && !isLoading) {
                  loadLocations(true);
                }
              }}
              disabled={refreshing || isLoading}>
              {refreshing || isLoading ? (
                <ActivityIndicator size="small" color="#18cb96" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#1e293b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={{
            height: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 44],
            }),
            opacity: fadeAnim,
            marginTop: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 8],
            }),
            overflow: 'hidden',
          }}>
          <View className="flex-row items-center rounded-lg bg-background-100 px-3">
            <Ionicons name="search-outline" size={16} color="#64748b" />
            <TextInput
              className="ml-2 h-10 flex-1 text-text-dark"
              placeholder="Buscar local..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#18cb96" />
          <Text className="mt-4 text-gray-500">Carregando locais...</Text>
        </View>
      ) : filteredLocations.length > 0 ? (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            if (!refreshing && !isLoading) {
              loadLocations(true);
            }
          }}
          refreshing={refreshing}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name={searchQuery ? 'search-outline' : 'location-outline'}
            size={64}
            color="#cbd5e1"
          />
          <Text className="mt-4 text-center text-lg font-bold text-text-dark">
            {searchQuery ? 'Nenhum local encontrado' : 'Nenhum local cadastrado'}
          </Text>
          <Text className="mt-2 text-center text-sm text-text-light">
            {searchQuery
              ? `Não encontramos locais com "${searchQuery}"`
              : 'Adicione seus locais de plantão para começar a organizá-los.'}
          </Text>

          {!searchQuery && (
            <TouchableOpacity
              className="mt-6 flex-row items-center rounded-lg bg-primary px-4 py-2.5 shadow-sm"
              onPress={handleAddLocation}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Adicionar Local</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{ elevation: 4 }}
        activeOpacity={0.9}
        onPress={handleAddLocation}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <LocationFormModal
        visible={isAddModalVisible}
        onClose={handleModalClose}
        locationId={selectedLocation?.id}
        onSuccess={handleModalSuccess}
      />
    </SafeAreaView>
  );
};

export default LocationsScreen;
