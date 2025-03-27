import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Definindo o tipo para um local
interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
}

// Dados fictícios para locais
const SAMPLE_LOCATIONS: Location[] = [
  {
    id: "1",
    name: "Hospital São Lucas",
    address: "Av. Ipiranga, 6690 - Partenon, Porto Alegre",
    phone: "(51) 3320-3000",
  },
  {
    id: "2",
    name: "Hospital Moinhos de Vento",
    address: "R. Ramiro Barcelos, 910 - Moinhos de Vento, Porto Alegre",
    phone: "(51) 3314-3434",
  },
  {
    id: "3",
    name: "Hospital de Clínicas",
    address: "R. Ramiro Barcelos, 2350 - Santa Cecília, Porto Alegre",
    phone: "(51) 3359-8000",
  },
];

export default function LocationsScreen() {
  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity style={styles.locationCard}>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
        <Text style={styles.locationPhone}>{item.phone}</Text>
      </View>
      <View style={styles.locationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={20} color="#0077B6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="map-outline" size={20} color="#0077B6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Locais</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#2B2D42" />
        </TouchableOpacity>
      </View>

      {SAMPLE_LOCATIONS.length > 0 ? (
        <FlatList
          data={SAMPLE_LOCATIONS}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color="#8D99AE" />
          <Text style={styles.emptyText}>Nenhum local disponível</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar Local</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2B2D42",
  },
  searchButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2B2D42",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#8D99AE",
    marginBottom: 4,
  },
  locationPhone: {
    fontSize: 14,
    color: "#8D99AE",
  },
  locationActions: {
    justifyContent: "space-around",
    marginLeft: 16,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#8D99AE",
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0077B6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0077B6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
