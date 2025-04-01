import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../app/contexts/AuthContext';

export default function ShiftsScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}</Text>
          <Text style={styles.subtitle}>Seus plantões</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Plantões</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#8D99AE" />
            <Text style={styles.emptyText}>Você não tem plantões agendados</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Adicionar Plantão</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#8D99AE" />
            <Text style={styles.emptyText}>Nenhum plantão encontrado no histórico</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B2D42',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8D99AE',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B2D42',
  },
  seeAll: {
    fontSize: 14,
    color: '#0077B6',
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#8D99AE',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0077B6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
