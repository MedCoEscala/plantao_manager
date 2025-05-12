import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/components/ui/Toast';

interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  color: string;
  shiftCount?: number;
}

const MOCK_LOCATIONS_DATA: Location[] = [
  {
    id: 'loc1',
    name: 'Hospital Central',
    address: 'Av. Principal, 123',
    phone: '(51) 9999-1111',
    color: '#0077B6',
    shiftCount: 12,
  },
  {
    id: 'loc2',
    name: 'Clínica Sul',
    address: 'Av. Secundária, 456',
    phone: '(51) 9999-2222',
    color: '#2A9D8F',
    shiftCount: 8,
  },
  {
    id: 'loc3',
    name: 'Posto de Saúde Norte',
    address: 'Travessa Terciária, 789',
    color: '#E9C46A',
    shiftCount: 5,
  },
  {
    id: 'loc4',
    name: 'Hospital Universitário',
    address: 'Rua das Universidades, 1000',
    phone: '(51) 3333-4444',
    color: '#E76F51',
    shiftCount: 15,
  },
  {
    id: 'loc5',
    name: 'Centro Médico Leste',
    address: 'Av. Leste, 789',
    color: '#9381FF',
    shiftCount: 7,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS_DATA);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(MOCK_LOCATIONS_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const { showDialog } = useDialog();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showSearch, fadeAnim]);

  useEffect(() => {
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
  }, [searchQuery, locations]);

  const loadLocations = useCallback(async () => {
    setRefreshing(true);

    try {
      await new Promise((res) => setTimeout(res, 1000));
      setLocations(MOCK_LOCATIONS_DATA);
      setFilteredLocations(MOCK_LOCATIONS_DATA);
      showToast('Locais atualizados com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
      showToast('Erro ao carregar locais', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  const confirmDelete = useCallback(
    (location: Location) => {
      showDialog({
        title: 'Confirmar exclusão',
        message: `Deseja realmente excluir o local "${location.name}"?`,
        type: 'confirm',
        confirmText: 'Excluir',
        onConfirm: () => {
          setLocations((prev) => prev.filter((loc) => loc.id !== location.id));
          setFilteredLocations((prev) => prev.filter((loc) => loc.id !== location.id));
          showToast('Local excluído com sucesso', 'success');
        },
      });
    },
    [showDialog, showToast]
  );

  const navigateToEdit = useCallback(
    (location: Location) => {
      router.push({
        pathname: '/locations/edit',
        params: { id: location.id },
      });
    },
    [router]
  );

  const navigateToAdd = useCallback(() => {
    router.push('/locations/add');
  }, [router]);

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
              borderLeftColor: item.color,
            }}
            activeOpacity={0.7}
            onPress={() => navigateToEdit(item)}>
            <View className="flex-row">
              <View className="flex-1 p-4">
                <View className="mb-1 flex-row items-center">
                  <Text className="text-lg font-bold text-text-dark">{item.name}</Text>
                  {item.shiftCount !== undefined && (
                    <View className="ml-2 rounded-full bg-background-200 px-2 py-0.5">
                      <Text className="text-xs text-text-light">{item.shiftCount} plantões</Text>
                    </View>
                  )}
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
    [confirmDelete, navigateToEdit]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

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
              onPress={loadLocations}
              disabled={refreshing}>
              {refreshing ? (
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

      {filteredLocations.length > 0 ? (
        <FlatList
          data={filteredLocations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
          onRefresh={loadLocations}
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
              onPress={navigateToAdd}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-medium text-white">Adicionar Local</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {filteredLocations.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
          style={{ elevation: 4 }}
          activeOpacity={0.9}
          onPress={navigateToAdd}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
