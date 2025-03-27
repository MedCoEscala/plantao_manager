import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@app/contexts/AuthContext";
import * as Clipboard from "expo-clipboard";
import { showDatabaseInfo, showTableData } from "@app/utils/debug";
import { Tables } from "@app/database/schema";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return dateString;
    }
  };

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      Alert.alert(
        "ID Copiado",
        "O ID do usuário foi copiado para a área de transferência."
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sim", onPress: () => logout() },
    ]);
  };

  // Componente de debug para banco de dados
  const renderDebugSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug e Suporte</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#8D99AE" }]}
          onPress={() => showDatabaseInfo()}
        >
          <Text style={styles.buttonText}>
            Ver Informações do Banco de Dados
          </Text>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ver Dados (debug):</Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: "#8D99AE" }]}
            onPress={() => showTableData(Tables.USERS)}
          >
            <Text style={styles.smallButtonText}>Usuários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: "#8D99AE" }]}
            onPress={() => showTableData(Tables.LOCATIONS)}
          >
            <Text style={styles.smallButtonText}>Locais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: "#8D99AE" }]}
            onPress={() => showTableData(Tables.CONTRACTORS)}
          >
            <Text style={styles.smallButtonText}>Contratantes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: "#8D99AE" }]}
            onPress={() => showTableData(Tables.SHIFTS)}
          >
            <Text style={styles.smallButtonText}>Plantões</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: "#8D99AE" }]}
            onPress={() => showTableData(Tables.PAYMENTS)}
          >
            <Text style={styles.smallButtonText}>Pagamentos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user ? getInitials(user.name) : "?"}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || "Usuário"}</Text>
          <Text style={styles.email}>{user?.email || "email@exemplo.com"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>
                {user?.phone || "Não informado"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de Nascimento</Text>
              <Text style={styles.infoValue}>
                {formatDate(user?.birthDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opções</Text>
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="person-outline" size={20} color="#0077B6" />
              </View>
              <Text style={styles.optionText}>Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#0077B6"
                />
              </View>
              <Text style={styles.optionText}>Formulário de Contabilidade</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="download-outline" size={20} color="#0077B6" />
              </View>
              <Text style={styles.optionText}>Exportar Dados</Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.optionRow} onPress={copyUserId}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="copy-outline" size={20} color="#0077B6" />
              </View>
              <Text style={styles.optionText}>Copiar ID</Text>
              <Text style={styles.optionValue}>
                {user?.id.substring(0, 8) + "..."}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Adicionando a seção de debug */}
        {renderDebugSection()}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E76F51" />
          <Text style={styles.logoutText}>Sair do aplicativo</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0077B6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2B2D42",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#8D99AE",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2B2D42",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#2B2D42",
  },
  infoValue: {
    fontSize: 16,
    color: "#8D99AE",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  optionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 119, 182, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#2B2D42",
  },
  optionValue: {
    fontSize: 14,
    color: "#8D99AE",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#E76F51",
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#E76F51",
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: "#8D99AE",
  },
  // Estilos para a seção de debug
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
  },
  smallButton: {
    padding: 8,
    borderRadius: 8,
    margin: 4,
    minWidth: "30%",
    alignItems: "center",
  },
  smallButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 12,
  },
});
