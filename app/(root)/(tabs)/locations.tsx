import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDialog } from '@/contexts/DialogContext';

// --- MOCK DATA --- (Substituir por chamadas reais)
interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  color?: string;
}
const MOCK_LOCATIONS_DATA: Location[] = [
  {
    id: 'loc1',
    name: 'Hospital Central',
    address: 'Rua Principal, 123',
    phone: '51 9999-1111',
    color: '#0077B6',
  },
  {
    id: 'loc2',
    name: 'Clínica Sul',
    address: 'Av. Secundária, 456',
    phone: '51 9999-2222',
    color: '#2A9D8F',
  },
  {
    id: 'loc3',
    name: 'Posto de Saúde Norte',
    address: 'Travessa Terciária, 789',
    color: '#E9C46A',
  },
];
// --- FIM MOCK DATA ---

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const { showDialog } = useDialog();
  const router = useRouter();

  const loadLocations = useCallback(async () => {
    setRefreshing(true);
    // Simular carregamento (substituir por chamada real)
    await new Promise((res) => setTimeout(res, 1000));
    setLocations(MOCK_LOCATIONS_DATA); // Reset para mock
    setRefreshing(false);
    showDialog({ type: 'success', title: 'Atualizado', message: 'Locais recarregados (mock).' });
  }, [showDialog]);

  const confirmDelete = (location: Location) => {
    showDialog({
      title: 'Confirmar exclusão',
      message: `Deseja realmente excluir o local "${location.name}"? (Ação simulada)`,
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: () => {
        // Simular exclusão (remover do estado local)
        setLocations((prev) => prev.filter((loc) => loc.id !== location.id));
        showDialog({ title: 'Sucesso', message: 'Local excluído (simulado).', type: 'success' });
      },
    });
  };

  const navigateToEdit = (location: Location) => {
    showDialog({
      title: 'Em desenvolvimento',
      message: `Editar local "${location.name}" em breve!`,
      type: 'info',
    });
    // router.push({ pathname: '/locations/edit', params: { id: location.id } });
  };

  const navigateToAdd = () => {
    showDialog({ title: 'Em desenvolvimento', message: 'Adicionar local em breve!', type: 'info' });
    // router.push('/locations/add');
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToEdit(item)}>
      <View style={[styles.colorStripe, { backgroundColor: item.color || '#0077B6' }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.address && <Text style={styles.cardSubtitle}>{item.address}</Text>}
        {item.phone && <Text style={styles.cardSubtitle}>{item.phone}</Text>}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item)}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Locais</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadLocations}>
          <Ionicons name="refresh-outline" size={24} color="#2B2D42" />
        </TouchableOpacity>
      </View>

      {locations.length > 0 ? (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={loadLocations}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="location-outline" size={64} color="#8D99AE" />
          <Text style={styles.emptyText}>Nenhum local cadastrado.</Text>
          <TouchableOpacity style={styles.addButtonEmpty} onPress={navigateToAdd}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar Local</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={navigateToAdd}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  refreshButton: { padding: 8 },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  colorStripe: { width: 8 },
  cardContent: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  deleteButton: { justifyContent: 'center', paddingHorizontal: 16 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  addButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: { color: 'white', marginLeft: 8, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
