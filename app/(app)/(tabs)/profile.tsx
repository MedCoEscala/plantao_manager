import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@app/contexts/AuthContext";
import * as Clipboard from "expo-clipboard";
import { showDatabaseInfo, showTableData } from "@app/utils/debug";
import { Tables } from "@app/database/schema";
import { Toast } from "@app/components/ui/Toast";
import { showToast } from "@app/utils/toast";

// Estenda a interface User para incluir os campos necessários
declare module "@app/contexts/AuthContext" {
  interface User {
    phone?: string;
    birthDate?: string;
  }
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "info" | "warning",
  });

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

  const showLocalToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const copyUserId = async () => {
    if (user?.id) {
      await Clipboard.setStringAsync(user.id);
      showLocalToast(
        "ID do usuário copiado para a área de transferência",
        "success"
      );
    }
  };

  const handleLogout = () => {
    // Aqui podemos usar o diálogo nativo do componente de debug, pois ele já tem confirmação
    showDatabaseInfo();
    logout();
  };

  // Componente de debug para banco de dados
  const renderDebugSection = () => {
    return (
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-3">
          Debug e Suporte
        </Text>
        <TouchableOpacity
          className="bg-gray-400 p-3 rounded-lg mb-3"
          onPress={() => showDatabaseInfo()}
        >
          <Text className="text-white font-medium">
            Ver Informações do Banco de Dados
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center py-3">
          <Text className="text-base text-gray-800">Ver Dados (debug):</Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            className="bg-gray-400 p-2 rounded-lg m-1 min-w-[30%] items-center"
            onPress={() => showTableData(Tables.USERS)}
          >
            <Text className="text-xs text-white font-medium">Usuários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-400 p-2 rounded-lg m-1 min-w-[30%] items-center"
            onPress={() => showTableData(Tables.LOCATIONS)}
          >
            <Text className="text-xs text-white font-medium">Locais</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-400 p-2 rounded-lg m-1 min-w-[30%] items-center"
            onPress={() => showTableData(Tables.CONTRACTORS)}
          >
            <Text className="text-xs text-white font-medium">Contratantes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-400 p-2 rounded-lg m-1 min-w-[30%] items-center"
            onPress={() => showTableData(Tables.SHIFTS)}
          >
            <Text className="text-xs text-white font-medium">Plantões</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-400 p-2 rounded-lg m-1 min-w-[30%] items-center"
            onPress={() => showTableData(Tables.PAYMENTS)}
          >
            <Text className="text-xs text-white font-medium">Pagamentos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 p-4">
        <View className="items-center my-6">
          <View className="w-20 h-20 rounded-full bg-blue-600 justify-center items-center mb-4">
            <Text className="text-2xl font-bold text-white">
              {user ? getInitials(user.name) : "?"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-1">
            {user?.name || "Usuário"}
          </Text>
          <Text className="text-base text-gray-500">
            {user?.email || "email@exemplo.com"}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Informações Pessoais
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-base text-gray-800">Telefone</Text>
              <Text className="text-base text-gray-500">
                {user?.phone || "Não informado"}
              </Text>
            </View>
            <View className="h-px bg-gray-200" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-base text-gray-800">
                Data de Nascimento
              </Text>
              <Text className="text-base text-gray-500">
                {formatDate(user?.birthDate)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">Opções</Text>
          <View className="bg-white rounded-xl shadow-sm">
            <TouchableOpacity className="flex-row items-center p-4">
              <View className="w-8 h-8 rounded-full bg-blue-100 justify-center items-center mr-4">
                <Ionicons name="person-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">
                Editar Perfil
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity className="flex-row items-center p-4">
              <View className="w-8 h-8 rounded-full bg-blue-100 justify-center items-center mr-4">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#0077B6"
                />
              </View>
              <Text className="flex-1 text-base text-gray-800">
                Formulário de Contabilidade
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity className="flex-row items-center p-4">
              <View className="w-8 h-8 rounded-full bg-blue-100 justify-center items-center mr-4">
                <Ionicons name="download-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">
                Exportar Dados
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#8D99AE" />
            </TouchableOpacity>

            <View className="h-px bg-gray-200" />

            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={copyUserId}
            >
              <View className="w-8 h-8 rounded-full bg-blue-100 justify-center items-center mr-4">
                <Ionicons name="copy-outline" size={20} color="#0077B6" />
              </View>
              <Text className="flex-1 text-base text-gray-800">Copiar ID</Text>
              <Text className="text-sm text-gray-500">
                {user?.id.substring(0, 8) + "..."}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Adicionando a seção de debug */}
        {renderDebugSection()}

        <TouchableOpacity
          className="flex-row items-center justify-center p-4 bg-white rounded-xl border border-red-500 my-4"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#E76F51" />
          <Text className="ml-2 text-base font-medium text-red-500">
            Sair do aplicativo
          </Text>
        </TouchableOpacity>

        <View className="items-center mb-6">
          <Text className="text-sm text-gray-500">Versão 1.0.0</Text>
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
    </SafeAreaView>
  );
}
